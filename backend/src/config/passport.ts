// config/passport.ts
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import UserModel from "../models/Users";
import dotenv from "dotenv";
import { Request, Response as ExpressResponse } from "express";
import { generateUsernameSuggestions } from "../utils/generateUsernameSuggestions";
import sessionStore from "../utils/sessionStore";
import { uploadProfilePhotoToCloud } from "../utils/uploadProfilePhotoToCloud";
dotenv.config();

async function handleSocialAuth({
  req,
  profile,
  accessToken,
  refreshToken,
  provider,
}: {
  req: Request;
  profile: any;
  accessToken: string;
  refreshToken: string;
  provider: "google" | "facebook";
}) {
  const role = req.query?.state as string | undefined;
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error("Email missing from social profile");

  let user = await UserModel.findOne({ email });

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  const loginEvent = {
    ip,
    userAgent: req.get("User-Agent") || "unknown",
    time: new Date(),
  };

  if (!user) {
    if (!role || !["influencer", "brand", "manager"].includes(role)) {
      const basicProfile = {
        name:
          profile.displayName ||
          `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
        email,
        provider,
        profilePictureUrl: profile.photos?.[0]?.value,
        providerUserId: profile.id,
      };

      const sessionId = await sessionStore.set(basicProfile, 5 * 60);
      (req.res as ExpressResponse).cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000,
      });

      (req.res as ExpressResponse).redirect(
        `${process.env.FRONTEND_URL}/signup/role?fromProvider=${provider}`
      );
      return null;
    }

    const usernameSuggested = await generateUsernameSuggestions(
      (email || "user").split("@")[0],
      1
    );

    const profilePictureUrl = profile.photos?.[0]?.value;
    let uploadedPictureUrl = "";
    if (profilePictureUrl) {
      try {
        uploadedPictureUrl = await uploadProfilePhotoToCloud(
          profilePictureUrl,
          "profile-pictures"
        );
      } catch (uploadErr) {
        console.error("Profile picture upload failed:", uploadErr);
        uploadedPictureUrl = "";
      }
    }

    user = new UserModel({
      name:
        profile.displayName ||
        `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
      email,
      username: usernameSuggested[0],
      role,
      avatar: uploadedPictureUrl,
      oauthProviders: [
        {
          provider,
          providerUserId: profile.id,
          accessToken,
          refreshToken,
        },
      ],
      isVerified: true,
      isTempAccount: false,
      loginHistory: [loginEvent],
    });

    await user.save();
    return user;
  }

  user.oauthProviders = user.oauthProviders || [];
  const existing = user.oauthProviders.find((p: any) => p.provider === provider);
  if (!existing) {
    user.oauthProviders.push({
      provider,
      providerUserId: profile.id,
      accessToken,
      refreshToken,
    });
  } else {
    existing.providerUserId = profile.id;
    existing.accessToken = accessToken;
    existing.refreshToken = refreshToken;
  }

  if (!user.avatar && profile.photos?.[0]?.value) {
    const profilePictureUrl = profile.photos?.[0]?.value;
    try {
      const uploaded = await uploadProfilePhotoToCloud(profilePictureUrl, "profile-pictures");
      if (uploaded) user.avatar = uploaded;
    } catch (err) {
      console.error("Profile picture upload failed:", err);
    }
  }

  user.loginHistory = user.loginHistory || [];
  user.loginHistory.push(loginEvent);
  await user.save();
  return user;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        const user = await handleSocialAuth({ req, profile, accessToken, refreshToken, provider: "google" });
        if (user === null) return; // redirect already handled
        return done(null, {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        } as any);
      } catch (err) {
        console.error("Google strategy error:", err);
        return done(err as any, undefined);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ["id", "emails", "name", "displayName", "picture.type(large)"],
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        const user = await handleSocialAuth({ req, profile, accessToken, refreshToken, provider: "facebook" });
        if (user === null) return; // redirect already handled
        return done(null, {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        } as any);
      } catch (err) {
        console.error("Facebook strategy error:", err);
        return done(err as any, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    if (user) {
      done(null, {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      } as any);
    } else {
      done(null, null);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;