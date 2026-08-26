import { Request, Response } from "express";
import UserModel from "../models/Users";
import { getRequestUserId } from "../utils/requestUser";

export const updateInfluencerSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can update settings" });
    }

    const { InfluencerProfile: incomingDetails, notificationPreferences } = req.body;

    let isModified = false;

    // Handle Preferences (Minimum Rate & Content Boundaries)
    if (incomingDetails?.preferences) {
      const existingDetails = user.InfluencerProfile || {};
      const newPreferences = {
        minimumRate: {
          amount: Number(incomingDetails.preferences.minimumRate?.amount) || existingDetails.preferences?.minimumRate?.amount || 0,
          currency: incomingDetails.preferences.minimumRate?.currency || existingDetails.preferences?.minimumRate?.currency || "INR",
        },
        contentBoundaries: incomingDetails.preferences.contentBoundaries ?? existingDetails.preferences?.contentBoundaries ?? "",
      };

      user.InfluencerProfile = {
        ...existingDetails,
        preferences: newPreferences,
      };
      isModified = true;
    }

    // Handle Notification Preferences
    if (notificationPreferences) {
      user.notificationPreferences = {
        newCollabInvites: notificationPreferences.newCollabInvites ?? user.notificationPreferences?.newCollabInvites ?? true,
        messageNotifications: notificationPreferences.messageNotifications ?? user.notificationPreferences?.messageNotifications ?? true,
        marketingUpdates: notificationPreferences.marketingUpdates ?? user.notificationPreferences?.marketingUpdates ?? false,
      };
      isModified = true;
    }

    if (isModified) {
      await user.save();
    }

    return res.status(200).json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating influencer settings:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
