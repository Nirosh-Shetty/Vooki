import express, { Response, Request } from "express";
import passport from "passport";
import {
  completeSocialAuth,
  requestOtp,
  signIn,
  signout,
  signUpBasicInfo,
  verifyOtp,
  getOAuthSession,
  getSocketToken,
  getCurrentUser,
} from "../controllers/auth/auth.controller";
import { generateToken } from "../utils/generateToken";
import { authMiddleware } from "../middleware/auth";
import { checkUsernameUnique } from "../controllers/checkUsernameUnique.controller";
import {
  forgotPassword,
  resetPassword,
  setPasswordForOAuth,
} from "../controllers/auth/passowrd.controller";
import { PassportUser } from "../types/passportUser";

const authRouter = express.Router();

authRouter.post("/signin", signIn);
authRouter.post("/signup", signUpBasicInfo);

authRouter.get("/google", (req, res, next): any => {
  const { role } = req.query;

  // if (!role || !["influencer", "brand", "manager"].includes(role as string)) {
  //   return res.status(400).json({ message: "Missing or invalid role" });
  // }
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      // "https://www.googleapis.com/auth/youtube.readonly",
      // "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    state: role as string,
  })(req, res, next);
});

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/signup/role`,
    session: false,
  }),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as PassportUser | undefined;
    if (!user?.id) {
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.cookie("auth_token", token, {
      httpOnly: true,
domain: process.env.COOKIE_DOMAIN ,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: Number(process.env.JWT_AUTH_TOKEN_MAXAGE) || 5 * 24 * 60 * 60 * 1000, // 5 days in milliseconds
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
    });
    res.redirect(`${process.env.FRONTEND_URL}/${user.role}/dashboard`);
  }
);

authRouter.get("/facebook", (req, res, next) => {
  const { role } = req.query;

  passport.authenticate("facebook", {
    scope: [
      "email",
      // "pages_show_list",
      // "pages_read_engagement",
      // "instagram_basic",
      // "instagram_manage_insights",
    ],
    state: role as string,
  })(req, res, next);
});
authRouter.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.FRONTEND_URL}/signup/role`, // Match Google
    session: false,
  }),
  (req: Request, res: Response): any => {
    const user = req.user as PassportUser | undefined;
    if (!user?.id) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const token = generateToken(user.id, user.role);

    res.cookie("auth_token", token, {
      httpOnly: true,
domain: process.env.COOKIE_DOMAIN ,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: Number(process.env.JWT_AUTH_TOKEN_MAXAGE) || 5 * 24 * 60 * 60 * 1000, // Match Google
      sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none", // Match Google
    });

    res.redirect(`${process.env.FRONTEND_URL}/${user.role}/dashboard`);
  }
);

authRouter.post("/signup/basic-info", signUpBasicInfo);
authRouter.post("/request-otp", requestOtp);
authRouter.post("/signup/request-otp", requestOtp); 
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/signup/verify-otp", verifyOtp); 

//when user tries to login through google/facebook and the user is not registered yet, then we store the profile info in a short-lived cookie and redirect to the role selection page
authRouter.get("/get-oauth-session", getOAuthSession);
authRouter.post("/complete-social-auth", completeSocialAuth);

// Get socket token endpoint - for frontend to fetch token from httpOnly cookie
// Protected with auth middleware to ensure only authenticated users can fetch tokens
authRouter.get("/get-socket-token", authMiddleware, getSocketToken);

// Get current user endpoint - for Auth context to fetch logged in user profile
authRouter.get("/me", authMiddleware, getCurrentUser);

authRouter.post("/signout", signout);

authRouter.post("/check-username-unique", checkUsernameUnique);

// Password reset and forgot password
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/set-password-oauth", setPasswordForOAuth); // For OAuth users to add password

export default authRouter;
