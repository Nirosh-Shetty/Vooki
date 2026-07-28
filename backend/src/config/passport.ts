import passport from "passport";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import UserModel from "../models/Users";
import { PassportUser } from "../types/passportUser";
import { OAuthProvider } from "../types/user";
import dotenv from "dotenv";
import { Request, Response as ExpressResponse } from "express";
import { generateUsernameSuggestions } from "../utils/generateUsernameSuggestions";
import sessionStore from "../utils/sessionStore";
import { uploadProfilePhotoToCloud } from "../utils/uploadProfilePhotoToCloud";

dotenv.config();

const ROLE_OPTIONS = new Set(["influencer", "brand", "manager"]);

type SocialAuthArgs = {
  req: Request;
  provider: "google" | "facebook";
  accessToken: string;
  refreshToken: string;
  profile: any;
  done: VerifyCallback;
};

const buildOAuthProvider = (
  provider: "google" | "facebook",
  providerUserId: string,
  accessToken: string,
  refreshToken: string,
  accessTokenExpires?: Date | null
): OAuthProvider => ({
  provider,
  providerUserId,
  accessToken,
  refreshToken,
  accessTokenExpires: accessTokenExpires ?? new Date(Date.now() + 60 * 60 * 1000),
});

const uploadAvatar = async (profilePictureUrl?: string) => {
  if (!profilePictureUrl) return "";

  try {
    return await uploadProfilePhotoToCloud(profilePictureUrl, "profile-pictures");
  } catch (uploadErr) {
    console.error("Profile picture upload failed:", uploadErr);
    return "";
  }
};

const resolveSocialDisplayName = (profile: any) => {
  return (
    profile.displayName ||
    `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim()
  );
};

const handleSocialAuth = async ({
  req,
  provider,
  accessToken,
  refreshToken,
  profile,
  done,
}: SocialAuthArgs) => {
  try {
    const role = req.query?.state as string | undefined;
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(null, false, { message: "Email missing" });
    }

    const providerUserId = String(profile.id);
    const displayName = resolveSocialDisplayName(profile);
    const avatarUrl = profile.photos?.[0]?.value;
    const avatar = await uploadAvatar(avatarUrl);
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    const loginEvent = {
      ip,
      userAgent: req.get("User-Agent") || "unknown",
      time: new Date(),
    };

    let user = await UserModel.findOne({ email });

    if (!user) {
      if (!role || !ROLE_OPTIONS.has(role)) {
        const basicProfile = {
          name: displayName,
          email,
          provider,
          providerUserId,
          accessToken,
          refreshToken,
          accessTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
          avatar: avatarUrl,
        };
        const sessionId = await sessionStore.set(basicProfile, 5 * 60);
        (req.res as ExpressResponse).cookie("sessionId", sessionId, {
          httpOnly: true,
          domain: process.env.COOKIE_DOMAIN,
          secure: process.env.COOKIE_SECURE === "true",
          maxAge: 10 * 60 * 1000,
        });

        return (req.res as ExpressResponse).redirect(
          `${process.env.FRONTEND_URL}/signup/role?fromProvider=${provider}`
        );
      }

      const usernameSuggested = await generateUsernameSuggestions(
        email.split("@")[0],
        1
      );

      user = new UserModel({
        name: displayName,
        email,
        username: usernameSuggested[0],
        role,
        avatar,
        oauthProviders: [
          buildOAuthProvider(
            provider,
            providerUserId,
            accessToken,
            refreshToken,
            new Date(Date.now() + 60 * 60 * 1000)
          ),
        ],
        isVerified: true,
        isTempAccount: false,
        loginHistory: [loginEvent],
      });

      await user.save();
    } else {
      const nextProvider = buildOAuthProvider(
        provider,
        providerUserId,
        accessToken,
        refreshToken,
        new Date(Date.now() + 60 * 60 * 1000)
      );

      const providers = Array.isArray(user.oauthProviders) ? user.oauthProviders : [];
      const providerIndex = providers.findIndex((item) => item.provider === provider);

      if (providerIndex >= 0) {
        providers[providerIndex] = {
          ...providers[providerIndex],
          ...nextProvider,
        };
      } else {
        providers.push(nextProvider);
      }

      user.oauthProviders = providers;
      if (!user.avatar && avatar) user.avatar = avatar;
      user.loginHistory.push(loginEvent);
      await user.save();
    }

    return done(null, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
    } as PassportUser);
  } catch (err) {
    console.error(`${provider} strategy error:`, err);
    return done(err, undefined);
  }
};

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
      await handleSocialAuth({
        req,
        provider: "google",
        accessToken,
        refreshToken,
        profile,
        done,
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
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
      await handleSocialAuth({
        req,
        provider: "facebook",
        accessToken,
        refreshToken,
        profile,
        done,
      });
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