import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import UserModel from "../../models/Users";
import { mailer } from "../../utils/mailer/index";
// import crypto from "crypto";
import sessionStore from "../../utils/sessionStore";

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //  Rate-limit resend attempts (30 seconds)
      const resendKey = `resend_reset_${normalizedEmail}`;
    const lastResendTime = await sessionStore.get(resendKey);
    
    if (lastResendTime) {
      const timePassed = Date.now() - parseInt(lastResendTime);
      const secondsRemaining = Math.ceil((2 * 60 * 1000 - timePassed) / 1000);
      
      return res.status(429).json({
        message: `Please wait ${secondsRemaining} seconds before requesting another email`,
        retryAfter: secondsRemaining,
      });
    }
    await sessionStore.setWithKey(resendKey, Date.now().toString(), 60); // block next request for 1 minute

    // Store reset info in Redis session store
    const tokenPayload = {
      userId: user._id,
      email: user.email,
    };

    const tokenTTL = 60 * 60; // 1 hour
    const token = await sessionStore.set(tokenPayload, tokenTTL);

    //Generate reset link
    let resetPath = "/reset-password";
    if (!resetPath.startsWith("/")) resetPath = `/${resetPath}`;
    const resetLink = `${process.env.FRONTEND_URL}${resetPath}?token=${token}`;

    //Send email
    await mailer(user.email, user.username, resetLink, "resetPassword");

    return res.status(200).json({ message: "Reset email sent successfully" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { token, newPassword } = req.body;
  const ip = req.ip;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: "Token and new password are required",
      errorIn: "invalid-token",
    });
  }

  try {
    // Rate limiting section
    const ipKey = `reset_attempts_ip_${ip}`;
    const tokenKey = `reset_attempts_token_${token}`;
    const maxAttempts = 5;
    const ttl = 15 * 60; // 15 minutes

    const ipAttempts = parseInt((await sessionStore.get(ipKey)) || "0");
    const tokenAttempts = parseInt((await sessionStore.get(tokenKey)) || "0");

    if (ipAttempts >= maxAttempts || tokenAttempts >= maxAttempts) {
      return res.status(429).json({
        message: "Too many attempts. Please try again later.",
        errorIn: "rate-limited",
      });
    }

    await sessionStore.setWithKey(ipKey, (ipAttempts + 1).toString(), ttl);
    await sessionStore.setWithKey(
      tokenKey,
      (tokenAttempts + 1).toString(),
      ttl
    );
    //TODO: Add Account Lockout After Multiple Fails (Optional)
    // If you notice brute-force attempts (e.g., 10+ fails per user/IP per hour), consider locking the account or requiring captcha/email verification.

    // Validate token
    const tokenPayload = await sessionStore.get(token);
    if (!tokenPayload || !tokenPayload.email) {
      return res.status(400).json({
        message: "Invalid or expired token",
        errorIn: "invalid-token",
      });
    }

    const user = await UserModel.findOne({ email: tokenPayload.email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorIn: "user-not-found",
      });
    }

    // Hash & save new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    if (!user.linkedAccounts) user.linkedAccounts = [];
    if (!user.linkedAccounts.includes("local")) user.linkedAccounts.push("local");
    await user.save();

    // Clean up
    await sessionStore.delete(token);
    await sessionStore.delete(`reset_block_${user.email}`);
    await sessionStore.delete(tokenKey);
    await sessionStore.delete(ipKey);

    // Send confirmation email
    await mailer(user.email, user.username, undefined, "resetPassConfirmation");

    return res.status(200).json({
      message: "Password reset successfully",
      errorIn: "success",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      message: "Internal server error",
      errorIn: "error",
    });
  }
};

// Set password for OAuth-only accounts (when user wants to add email/password login)
export const setPasswordForOAuth = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required", errorIn: "email" });
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Password is required", errorIn: "password" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match",
      errorIn: "confirmPassword",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
      errorIn: "password",
    });
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({
      message: "Password must contain letters and numbers",
      errorIn: "password",
    });
  }

  try {
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorIn: "email",
      });
    }

    // Check if user already has a password
    if (user.password) {
      return res.status(400).json({
        message: "This account already has a password. Use password reset instead.",
        errorIn: "password",
      });
    }

    // Check if user has OAuth providers (security check)
    if (!user.linkedAccounts || user.linkedAccounts.length === 0) {
      return res.status(400).json({
        message: "Only OAuth accounts can use this feature",
        errorIn: "account",
      });
    }

    // Hash & save new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    if (!user.linkedAccounts.includes("local")) {
      user.linkedAccounts.push("local");
    }
    await user.save();

    // Send confirmation email
    await mailer(user.email, user.username, undefined, "resetPassConfirmation");

    return res.status(200).json({
      message: "Password set successfully. You can now login with email and password.",
      errorIn: "success",
    });
  } catch (error) {
    console.error("Error in setPasswordForOAuth:", error);
    return res.status(500).json({
      message: "Internal server error",
      errorIn: "error",
    });
  }
};

