import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../models/Users";

export const getFeaturedContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const user = await UserModel.findById(userId).select(
      "influencerProfile.featuredContent influencerDetails.featuredContent"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const featured =
      user.influencerProfile?.featuredContent ||
      user.influencerDetails?.featuredContent ||
      [];

    return res.status(200).json({
      featuredContent: featured,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const addFeaturedContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "A valid post URL is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentFeatured =
      user.influencerProfile?.featuredContent ||
      user.influencerDetails?.featuredContent ||
      [];

    if (currentFeatured.length >= 5) {
      return res.status(400).json({ message: "You can feature a maximum of 5 content items." });
    }

    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      url: url.trim(),
      createdAt: new Date(),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          "influencerProfile.featuredContent": newItem,
          "influencerDetails.featuredContent": newItem,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(201).json({
      message: "Content added to portfolio",
      featuredContent:
        updatedUser?.influencerProfile?.featuredContent ||
        updatedUser?.influencerDetails?.featuredContent ||
        [],
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// src/controllers/influencer/feature.controller.ts
export const updateFeaturedContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { contentIds, updatedItem } = req.body;

    // Single item edit flow
    if (updatedItem && updatedItem.id && updatedItem.url) {
      const targetId = new mongoose.Types.ObjectId(updatedItem.id);

      const updatedUser = await UserModel.findOneAndUpdate(
        {
          _id: userId,
          $or: [
            { "influencerProfile.featuredContent._id": targetId },
            { "influencerDetails.featuredContent._id": targetId },
          ],
        },
        {
          $set: {
            "influencerProfile.featuredContent.$[elem].url": updatedItem.url.trim(),
            "influencerDetails.featuredContent.$[elem].url": updatedItem.url.trim(),
          },
        },
        {
          arrayFilters: [{ "elem._id": targetId }],
          new: true,
          runValidators: true,
        }
      );

      const featured =
        updatedUser?.influencerProfile?.featuredContent ||
        updatedUser?.influencerDetails?.featuredContent ||
        [];

      return res.status(200).json({
        message: "Portfolio item updated",
        featuredContent: featured,
      });
    }

    // Reorder / list replacement flow
    if (Array.isArray(contentIds)) {
      if (contentIds.length > 5) {
        return res.status(400).json({ message: "You can feature a maximum of 5 content items." });
      }

      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const currentItems =
        user.influencerProfile?.featuredContent ||
        user.influencerDetails?.featuredContent ||
        [];

      const itemMap = new Map(currentItems.map((item) => [item._id.toString(), item]));

      const reorderedItems = contentIds
        .map((id) => itemMap.get(id.toString()))
        .filter(Boolean);

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            "influencerProfile.featuredContent": reorderedItems,
            "influencerDetails.featuredContent": reorderedItems,
          },
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        message: "Featured content list updated",
        featuredContent:
          updatedUser?.influencerProfile?.featuredContent ||
          updatedUser?.influencerDetails?.featuredContent ||
          [],
      });
    }

    return res.status(400).json({ message: "Invalid payload provided" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFeaturedContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { contentId } = req.params;

    if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Valid Content ID is required" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: {
          "influencerProfile.featuredContent": { _id: contentId },
          "influencerDetails.featuredContent": { _id: contentId },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Content removed from featured",
      featuredContent:
        updatedUser?.influencerProfile?.featuredContent ||
        updatedUser?.influencerDetails?.featuredContent ||
        [],
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};