import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import UserModel from "../models/Users";
import { normalizeSocialConnectionsRecord } from "../utils/socialConnections";
import { getRequestUserId } from "../utils/requestUser";
import { uploadProfilePhotoToCloud } from "../utils/uploadProfilePhotoToCloud";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const profile = async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const socialConnections = normalizeSocialConnectionsRecord(
      user?.influencerDetails?.socialConnections
    );

    return res.status(200).json({
      ...user,
      influencerDetails: {
        ...user.influencerDetails,
        socialConnections,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const sanitizeSocialLinks = (input?: Record<string, string> | Map<string, string>) => {
  const map = new Map<string, string>()
  if (!input) return map
  if (input instanceof Map) {
    for (const [key, value] of input.entries()) {
      if (value) map.set(key, value)
    }
    return map
  }
  for (const [key, value] of Object.entries(input)) {
    if (value) map.set(key, value)
  }
  return map
}

const applyLocaleSafeString = (value?: string) => (typeof value === "string" ? value.trim() : undefined)

const decodeImageInput = (photo?: string): string | Buffer | null => {
  if (!photo) return null
  if (photo.startsWith("data:")) {
    const commaIndex = photo.indexOf(",")
    if (commaIndex === -1) return null
    const base64 = photo.slice(commaIndex + 1)
    return Buffer.from(base64, "base64")
  }
  return photo
}

const uploadNewProfilePhoto = async (photo?: string): Promise<string | null> => {
  const payload = decodeImageInput(photo)
  if (!payload) return null
  try {
    return await uploadProfilePhotoToCloud(payload)
  } catch (error) {
    console.error("Error uploading profile photo:", error)
    return null
  }
}

export const getPublicInfluencerProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    const user: any = await UserModel.findOne({
      _id: userId,
      role: "influencer",
    })
      .select(
        "name username role profilePicture isVerified rating totalReviews influencerDetails.niche influencerDetails.followers influencerDetails.socialLinks"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    const followers = Number(user?.influencerDetails?.followers || 0);
    const engagementRate = clamp(
      Number((3 + Math.log10(Math.max(followers, 10)) * 1.35).toFixed(1)),
      1.8,
      10.5
    );
    const avgViews = Math.round(followers * (engagementRate / 100) * 4.3);
    const estCpv = Number(
      (avgViews > 0 ? Math.max(0.02, 6.5 / avgViews) : 0.08).toFixed(2)
    );
    const fitScore = clamp(
      Math.round(
        55 + Math.min(30, engagementRate * 3.2) + (user.isVerified ? 7 : 0)
      ),
      50,
      98
    );

    const socialLinks = user?.influencerDetails?.socialLinks
      ? Object.fromEntries(Object.entries(user.influencerDetails.socialLinks))
      : {};

    return res.status(200).json({
      id: String(user._id),
      name: user.name || "",
      handle: user.username ? `@${user.username}` : "",
      role: user.role,
      profilePicture: user.profilePicture || "",
      verified: Boolean(user.isVerified),
      niche: user?.influencerDetails?.niche || "General",
      followers,
      rating: Number(user.rating || 0),
      totalReviews: Number(user.totalReviews || 0),
      socialLinks,
      metrics: {
        engagementRate,
        avgViews,
        estCpv,
        fitScore,
      },
      highlights: [
        "Campaign-ready workflow and timely communication",
        "Structured content planning and deliverable tracking",
        "ROI-focused collaboration style for brand outcomes",
      ],
    });
  } catch (error) {
    console.error("Error fetching public influencer profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateInfluencerProfile = async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req)
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    if (user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can update this profile" })
    }

    const { name, username, email, phone, influencerDetails } = req.body
    if (typeof name === "string") user.name = name.trim()
    if (typeof username === "string") user.username = username.trim()
    if (typeof email === "string") user.email = email.trim().toLowerCase()
    if (phone) user.phone = Number(phone)

    const existingDetails = user.influencerDetails || {}
    const links = sanitizeSocialLinks(existingDetails.socialLinks)
    if (influencerDetails?.socialLinks) {
      const incoming = sanitizeSocialLinks(influencerDetails.socialLinks)
      for (const [key, value] of incoming.entries()) {
        links.set(key, value)
      }
    }

    user.influencerDetails = {
      ...existingDetails,
      followers: influencerDetails?.followers ?? existingDetails.followers,
      niche: applyLocaleSafeString(influencerDetails?.niche) ?? existingDetails.niche,
      summary: applyLocaleSafeString(influencerDetails?.summary) ?? existingDetails.summary,
      highlight: applyLocaleSafeString(influencerDetails?.highlight) ?? existingDetails.highlight,
      audience: applyLocaleSafeString(influencerDetails?.audience) ?? existingDetails.audience,
      engagement: Number(influencerDetails?.engagement) || existingDetails.engagement,
      socialLinks: links,
    }

    const photoUrl = await uploadNewProfilePhoto(req.body.photo)
    if (photoUrl) {
      user.profilePicture = photoUrl
    }

    await user.save()
    return res.status(200).json({ message: "Influencer profile updated" })
  } catch (error) {
    console.error("Error updating influencer profile:", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updateBrandProfile = async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req)
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    if (user.role !== "brand") {
      return res.status(403).json({ message: "Only brands can update this profile" })
    }

    const { name, username, email, phone, brandDetails } = req.body
    if (typeof name === "string") user.name = name.trim()
    if (typeof username === "string") user.username = username.trim()
    if (typeof email === "string") user.email = email.trim().toLowerCase()
    if (phone) user.phone = Number(phone)

    const existingDetails = user.brandDetails || {}
    user.brandDetails = {
      ...existingDetails,
      companyName: applyLocaleSafeString(brandDetails?.companyName) ?? existingDetails.companyName,
      website: brandDetails?.website ?? existingDetails.website,
      brandCategory: applyLocaleSafeString(brandDetails?.brandCategory) ?? existingDetails.brandCategory,
      summary: applyLocaleSafeString(brandDetails?.summary) ?? existingDetails.summary,
      collaborations: existingDetails.collaborations,
      activeCampaigns: Number(brandDetails?.activeCampaigns) || existingDetails.activeCampaigns,
      pointsOfContact: Number(brandDetails?.pointsOfContact) || existingDetails.pointsOfContact,
    }

    const photoUrl = await uploadNewProfilePhoto(req.body.photo)
    if (photoUrl) {
      user.profilePicture = photoUrl
    }

    await user.save()
    return res.status(200).json({ message: "Brand profile updated" })
  } catch (error) {
    console.error("Error updating brand profile:", error)
    return res.status(500).json({ message: "Server error" })
  }
}
