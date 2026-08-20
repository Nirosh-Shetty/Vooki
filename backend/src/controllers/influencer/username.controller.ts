import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../models/Users";

export const getUsernameAvailability = async (req: Request, res: Response) => {
  try {
    const rawUsername = req.params.username;

    if (!rawUsername || !rawUsername.trim()) {
      return res.status(400).json({
        available: false,
        message: "Username parameter is required",
      });
    }

    const username = rawUsername.trim();
    const currentUserId = req.user?.id || req.user?._id;

    // Build query: case-insensitive match on username
    const query: Record<string, any> = {
      username: { $regex: new RegExp(`^${username}$`, "i") },
    };

    // If the user is logged in, exclude their own document so their current username reports as available to them
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    }

    // Use exists() or findOne().select("_id") for an indexed, lightweight check
    const existingUser = await UserModel.exists(query);

    const isAvailable = !existingUser;

    return res.status(200).json({
      available: isAvailable,
      message: isAvailable
        ? "Username is available"
        : "Username is already taken",
    });
  } catch (error: any) {
    return res.status(500).json({
      available: false,
      message: error.message || "Failed to verify username availability",
    });
  }
};