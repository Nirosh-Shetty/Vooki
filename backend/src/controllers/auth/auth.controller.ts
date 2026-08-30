import { Request, Response } from "express";
import { generateToken } from "../../utils/generateToken";
import UserModel from "../../models/Users";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { mailer } from "../../utils/mailer/index";
import sessionStore from "../../utils/sessionStore";
import { generateUsernameSuggestions } from "../../utils/generateUsernameSuggestions";
import { uploadProfilePhotoToCloud } from "../../utils/uploadProfilePhotoToCloud";
import { getRequestUserId } from "../../utils/requestUser";
// import { apiResponse } from "../types/apiResponse";
export const signUpBasicInfo = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { name, email, username, password, role } = req.body;

  try {
    //TODO: you need to check if the username is taken or not even though it's already checked in, but it can be bypassed by some tricks. try doing a util function called checkUsernameUnique and use it here and you aslo use it in the checkUSernameUnique controller. ALSo use status code 409 if the username is taken as i used the same status code in the frontend for this purpoose
    const existingUser = await UserModel.findOne({ email });

    // ✅ Case 1: User is already verified
    if (
      existingUser &&
      !existingUser.isTempAccount &&
      existingUser.isVerified
    ) {
      const linkedProviders =
        existingUser.oauthProviders
          ?.filter((provider) => provider.provider !== "local")
          .map((provider) => provider.provider) || [];

      if (linkedProviders.length > 0 && !existingUser.password) {
        const providerText = linkedProviders
          .map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1))
          .join(" or ");

        return res.status(400).json({
          message: `An account with this email already exists and is connected to ${providerText}. Please sign in with ${providerText} or use a different email.`,
          errorIn: "email",
          linkedAccounts: linkedProviders,
          redirectTo: "/signin",
        });
      }

      return res.status(400).json({
        message: "An account with this email already exists. Please sign in instead.",
        errorIn: "email",
        redirectTo: "/signin",
      });
    }

    // ✅ Case 2: Pending signup, reservation not expired
    if (
      existingUser &&
      existingUser.isTempAccount &&
      !existingUser.isVerified &&
      existingUser.reservationExpiresAt &&
      existingUser.reservationExpiresAt > new Date()
    ) {
      return res.status(201).json({
        message:
          "A signup is already in progress for this email. Please verify your email to continue.",
        redirectTo: "/signup/verify-otp",
      });
    }

    // ✅ Case 3: Expired reservation or never existed — clean up and allow re-signup
    if (existingUser) {
      await UserModel.deleteOne({ _id: existingUser._id });
    }
    if (!name || !email || !username || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
        errorIn: "allFields",
      });
    }

    // ✅ Now create a new temp user
    const hashedPass = await bcryptjs.hash(password, 10);


    await UserModel.create({
      name,
      email,
      username,
      password: hashedPass,
      role,
      oauthProviders: [{ provider: "local" }],
      isVerified: false,
      isTempAccount: true,
      reservationExpiresAt: new Date(
        Date.now() +
        (Number(process.env.USER_RESERVATION_EXPIRY_MS) || 60 * 60 * 1000)
      ),
      isPremium: false,
      jwtVersion: 1,
      statsConnection: {},
      loginHistory: [],
    });

    return res.status(201).json({
      message: "User Created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error creating user", error });
  }
};
export const signIn = async (req: Request, res: Response): Promise<any> => {
  const { identifier, password } = req.body;

  if (!identifier) {
    return res
      .status(400)
      .json({ message: "Identifier is required", errorIn: "identifier" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ message: "Password is required", errorIn: "password" });
  }

  try {
    // Check if identifier is email, username, or phone number
    const orQuery: any[] = [{ email: identifier }, { username: identifier }];
    // If identifier is a phone number, add it to the query
    if (/^\d{10}$/.test(identifier)) {
      orQuery.push({ phone: Number(identifier) });
    }


    const user = await UserModel.findOne({
      $or: orQuery,
    }).select("+password") as import("../../types/user").IUser | null;

    if (
      !user ||
      (!user.isVerified &&
        user.isTempAccount &&
        user.reservationExpiresAt &&
        user.reservationExpiresAt < new Date())
    ) {
      return res
        .status(401)
        .json({ message: "User not found", errorIn: "identifier" });
    }

    if (
      !user.isVerified &&
      user.isTempAccount &&
      user.reservationExpiresAt &&
      user.reservationExpiresAt > new Date()
    ) {
      return res.status(401).json({
        message: "Account verification required",
        redirectTo: "/signup/verify-otp",
        errorIn: "identifier",
      });
    }
    if (!user.password) {
      const linkedProviders =
        user.oauthProviders
          ?.filter((provider) => provider.provider !== "local")
          .map((provider) => provider.provider) || [];

      return res.status(400).json({
        message: `This account doesn't have a password set. Please log in with ${linkedProviders.length > 0 ? linkedProviders.map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1)).join(" or ") : "a social provider"} or use Forgot Password to set one.`,
        errorIn: "identifier",
      });
    }
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Incorrect password", errorIn: "password" });
    }

    //store the login event
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    const loginEvent = {
      ip,
      userAgent: req.get("User-Agent") || "unknown",
      time: new Date(),
    };
    // Update login history
    user?.loginHistory?.push(loginEvent);

    await user.save();

    const token = generateToken(user._id.toString(), user.role, user?.username);

    res.cookie("auth_token", token, {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge:
        Number(process.env.JWT_AUTH_TOKEN_MAXAGE) || 5 * 24 * 60 * 60 * 1000,
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      message: "User signed in successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error logging in", error });
  }
};

export const requestOtp = async (req: Request, res: Response): Promise<any> => {
  //TODO: rate limit otp request per hour/day
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Cannot find the email. Please signup again.",
        redirectTo: "/signup/basic-info",
      });
    }
    // Check if the user exists and is a temp account
    const user = await UserModel.findOne({ email }).lean() as import("../../types/user").IUser | null;
    if (!user) {
      return res.status(400).json({
        message: "User not found. You need to signup again",
        redirectTo: "/signup/basic-info",
      });
    }
    if (user.isVerified && !user.isTempAccount) {
      return res.status(400).json({
        message: "User is already verified. You can  signin directly",
        redirectTo: "/login",
      });
    }
    if (
      user.isTempAccount &&
      user.reservationExpiresAt &&
      user.reservationExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Reservation expired. You need to signup again",
        redirectTo: "/signup/basic-info",
      });
    }

    if (
      user.lastOtpSentAt &&
      user.lastOtpSentAt.getTime() > Date.now() - 60 * 1000
    ) {
      return res.status(400).json({
        message: "OTP already sent",
        lastOtpSentAt: user.lastOtpSentAt,
      });
    }
    const otp = crypto.randomInt(100000, 1000000).toString(); // Generate a 6-digit OTP
    const response = await mailer(email, user.username, otp, "otp");
    if (!response) {
      return res.status(500).json({ message: "Error sending OTP" });
    }
    if (!response.success) {
      return res.status(500).json({ message: response.message });
    }
    // Save OTP to the user record
    await UserModel.updateOne(
      { email },
      {
        $set: {
          otp,
          lastOtpSentAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error, "this is error in sendOtpEmail function");
    return res.status(500).json({ message: "Error sending OTP" });
  }
};
export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found", redirectTo: "/signup/basic-info" });

    if (user.isVerified)
      return res
        .status(400)
        .json({ message: "User is already verified", redirectTo: "/signin" });

    if (user.reservationExpiresAt && user.reservationExpiresAt < new Date())
      return res.status(400).json({
        message: "Reservation expired",
        redirectTo: "/signup/basic-info",
      });

    // if (user.otp !== otp)
    //TODO: change this during production
    if ("111111" !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    const loginEvent = {
      ip,
      userAgent: req.get("User-Agent") || "unknown",
      time: new Date(),
    };
    user.isVerified = true;
    user.otp = undefined; // Clear OTP after verification
    user.isTempAccount = false; // Mark account as permanent
    user.reservationExpiresAt = undefined;
    if (!user.oauthProviders) user.oauthProviders = [];
    if (!user.oauthProviders.some((provider) => provider.provider === "local")) {
      user.oauthProviders.push({ provider: "local" });
    }
    user.loginHistory.push(loginEvent); // Store login event

    await user.save();

    const token = generateToken(user._id.toString(), user.role, user?.username);
    res.cookie("auth_token", token, {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
    });
    return res.status(201).json({ message: "Verified Successfully" });
  } catch (error) {
    console.error(error); // log internally
    return res.status(500).json({ message: "Internal server error" });
  }
};

//when user trues tries to login through google/facebook and the user is not registered yet, then we store the profile info in a short-lived cookie and redirect to the role selection page
export const completeSocialAuth = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { role, fromProvider } = req.body;
    if (!fromProvider) {
      res.clearCookie("sessionId", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(400).json({
        message: "fromProvider is required",
        redirectTo: "/signup/role",
      });
    }
    if (!role) {
      res.clearCookie("sessionId", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(400).json({
        message: "Role is required",
        redirectTo: "/signup/role",
      });
    }
    const sessionId = req.cookies.sessionId;
    const sessionData = await sessionStore.get(sessionId);
    if (!sessionData) {
      return res.status(400).json({
        message: "Session expired or invalid. Please try signing up again.",
        redirectTo: "/signup/role",
      });
    }

    // If session data is valid, proceed with signup
    const {
      email,
      name,
      provider,
      providerUserId,
      accessToken = "",
      refreshToken = "",
      accessTokenExpires,
      avatar = "",
      profilePictureUrl = "",
    } = sessionData;
    if (!email || !name || !provider) {
      return res.status(400).json({
        message: "Incomplete session data. Please try signing up again.",
        redirectTo: "/signup/role",
      });
    }
    if (fromProvider !== provider) {
      return res.status(400).json({
        message: "Invalid provider",
        redirectTo: "/signup/role",
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists. Please log in.",
        redirectTo: "/login",
      });
    }

    const usernameSuggested = await generateUsernameSuggestions(
      email.split("@")[0],
      1
    );

    let uploadedAvatar = "";
    const incomingAvatar = avatar || profilePictureUrl;
    if (incomingAvatar) {
      try {
        uploadedAvatar = await uploadProfilePhotoToCloud(
          incomingAvatar,
          "profile-pictures"
        );
      } catch (uploadErr) {
        console.error("Avatar upload failed:", uploadErr);
        uploadedAvatar = "";
      }
    }
    const oauthProvider = {
      provider,
      providerUserId,
      accessToken,
      refreshToken,
      accessTokenExpires,
    };
    const newUser = new UserModel({
      name,
      email,
      username: usernameSuggested[0],
      role,
      avatar: uploadedAvatar,
      oauthProviders: [
        {
          provider,
          providerUserId,
          accessToken,
          refreshToken,
          accessTokenExpires,
        },
      ],
      isVerified: true,
      isTempAccount: false,
    });

    await newUser.save();
    const token = generateToken(newUser._id.toString(), newUser.role, newUser.username);
    // Clear the session cookie
    await sessionStore.delete(sessionId);
    // Clear the session cookie and set auth_token cookie
    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.cookie("auth_token", token, {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days in milliseconds
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
    });
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error in completeSocialAuth:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signout = (req: Request, res: Response): any => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
      path: "/",
    });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("Error during signout:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOAuthSession = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(400).json({
        message: "No session found. Please try signing up again.",
        redirectTo: "/signin",
      });
    }

    const sessionData = await sessionStore.get(sessionId);
    if (!sessionData) {
      return res.status(400).json({
        message: "Session expired. Please try signing up again.",
        redirectTo: "/signin",
      });
    }

    return res.status(200).json({
      user: sessionData,
    });
  } catch (error) {
    console.error("Error retrieving OAuth session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get socket token - returns the auth token from httpOnly cookie
// This is needed because frontend cannot read httpOnly cookies, but can use this endpoint
export const getSocketToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      console.log("❌ No auth_token cookie found");
      console.log("   Available cookies:", Object.keys(req.cookies));
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log("✅ Returning socket token to frontend");
    // Return token (not httpOnly, so frontend can read it)
    return res.status(200).json({
      token,
    });
  } catch (error) {
    console.error("Error getting socket token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get current user profile - used by Auth context to fetch logged in user data
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await UserModel.findById(userId).select(
      "-password -oauthProviders.accessToken -oauthProviders.refreshToken -loginHistory -otp"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        brandProfile: user.brandProfile,
        influencerProfile: user.influencerProfile,
        rating: user.rating,
        totalReviews: user.totalReviews,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
