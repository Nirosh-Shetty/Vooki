import { Request, Response } from "express";
import DiscoverInviteModel, {
  IDiscoverInvite,
  ICounterOffer,
} from "../models/DiscoverInvite";
import CampaignModel from "../models/Campaign";
import UserModel from "../models/Users";
import { getRequestUser, getRequestUserId } from "../utils/requestUser";
import { findOrCreateDirectConversation } from "../utils/directConversation";
import PromotionModel from "../models/Promotion";
import MessageModel from "../models/Message";
import ConversationModel from "../models/Conversation";

/** 
 * BRAND: Create collaboration invite
 * POST /api/collaborations/invites
 */
export const createCollaborationInvite = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id || requester.role !== "brand") {
      return res
        .status(403)
        .json({ message: "Only brands can create invites" });
    }

    const {
      influencerId,
      campaignId,
      collaborationType,
      deliverables,
      timeline,
      compensation,
      brandMessage,
    } = req.body;

    // Validation
    if (!influencerId || !campaignId) {
      return res
        .status(400)
        .json({ message: "influencerId and campaignId are required" });
    }

    if (
      !collaborationType ||
      ![
        "sponsored_post",
        "affiliate",
        "ambassador",
        "ugc",
        "event",
        "long_term",
      ].includes(collaborationType)
    ) {
      return res.status(400).json({ message: "Invalid collaborationType" });
    }

    // Verify campaign exists and belongs to brand
    const campaign = await CampaignModel.findOne({
      _id: String(campaignId),
      brandId: requester.id,
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ message: "Campaign not found or not owned by this brand" });
    }

    // Verify influencer exists
    const influencer = await UserModel.findOne({
      _id: String(influencerId),
      role: "influencer",
    });

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    // Check for existing pending invite
    const existingInvite = await DiscoverInviteModel.findOne({
      brandId: requester.id,
      influencerId: String(influencerId),
      campaignId: String(campaignId),
      status: "pending",
    });

    if (existingInvite) {
      return res
        .status(409)
        .json({ message: "Pending invite already exists for this campaign" });
    }

    // Validate compensation
    if (!compensation || !compensation.type) {
      return res
        .status(400)
        .json({ message: "Compensation type is required" });
    }

    if (compensation.type === "fixed" && !compensation.amount) {
      return res
        .status(400)
        .json({ message: "Amount is required for fixed compensation" });
    }

    if (
      compensation.type === "range" &&
      (!compensation.minAmount || !compensation.maxAmount)
    ) {
      return res.status(400).json({
        message: "Min and max amounts are required for range compensation",
      });
    }

    // Validate deliverables
    if (
      !Array.isArray(deliverables) ||
      deliverables.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one deliverable is required" });
    }

    // Process timeline with sensible defaults
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const processedTimeline = {
      postingStartDate: timeline?.postingStartDate ? new Date(timeline.postingStartDate) : defaultStart,
      postingEndDate: timeline?.postingEndDate ? new Date(timeline.postingEndDate) : defaultEnd,
      draftDueDate: timeline?.draftDueDate ? new Date(timeline.draftDueDate) : undefined,
      responseDeadline: timeline?.responseDeadline ? new Date(timeline.responseDeadline) : defaultDeadline,
    };

    // Check for existing active invites
    const existingActiveInvite = await DiscoverInviteModel.findOne({
      brandId: requester.id,
      influencerId: String(influencerId),
      campaignId: String(campaignId),
      status: { $in: ["pending", "counter_offered"] },
    });

    if (existingActiveInvite) {
      return res.status(400).json({
        message:
          "An active invite already exists for this creator on this campaign. Please continue the negotiation in your messages.",
      });
    }

    // Create invite
    const newInvite = await DiscoverInviteModel.create({
      brandId: requester.id,
      influencerId: String(influencerId),
      campaignId: String(campaignId),
      campaignTitle: String(campaign.name),
      collaborationType,
      deliverables,
      timeline: processedTimeline,
      compensation,
      brandMessage: String(brandMessage || "").trim(),
      status: "pending",
    });

    // Increment invitedCreators on campaign
    await CampaignModel.updateOne(
      { _id: String(campaignId) },
      { $inc: { invitedCreators: 1 } }
    );

    // Fetch brand info for response
    const brand = await UserModel.findById(requester.id).select(
      "_id name avatar"
    );

    return res.status(201).json({
      message: "Invite created successfully",
      invite: {
        _id: newInvite._id,
        campaignTitle: newInvite.campaignTitle,
        collaborationType: newInvite.collaborationType,
        deliverables: newInvite.deliverables,
        compensation: newInvite.compensation,
        timeline: newInvite.timeline,
        brandMessage: newInvite.brandMessage,
        status: newInvite.status,
        brand: {
          id: brand?._id,
          name: brand?.name,
          avatar: brand?.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Error creating collaboration invite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * BRAND: Get all invites sent for a brand (optionally filtered by campaign)
 * GET /api/collaborations/invites
 */
export const getBrandInvites = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id || requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can view these invites" });
    }

    const { campaignId, status, limit } = req.query;

    let query: any = { brandId: requester.id };

    if (campaignId) {
      query.campaignId = String(campaignId);
    }

    if (status && status !== "all") {
      query.status = String(status);
    }

    let invitesQuery = DiscoverInviteModel.find(query).sort({ createdAt: -1 });

    if (limit) {
      invitesQuery = invitesQuery.limit(Number(limit));
    }

    const invites = await invitesQuery.lean();

    // Fetch influencer info for each invite
    const invitesWithInfluencerInfo = await Promise.all(
      invites.map(async (invite: any) => {
        const influencer = await UserModel.findById(invite.influencerId).select(
          "_id name username InfluencerProfile.niche avatar"
        );

        return {
          id: invite._id,
          influencerId: invite.influencerId,
          influencerName: influencer?.name || "",
          influencerHandle: influencer?.username || "",
          influencerNiche: influencer?.InfluencerProfile?.niche || "",
          campaignId: invite.campaignId,
          campaignLabel: invite.campaignTitle,
          note: invite.brandMessage || "",
          status: invite.status,
          promotionId: invite.promotionId || "",
          promotionStatus: "", // Can fetch promotion status if needed, but not strictly required
          createdAt: invite.createdAt,
        };
      })
    );

    return res.status(200).json({
      items: invitesWithInfluencerInfo,
    });
  } catch (error) {
    console.error("Error fetching brand invites:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATOR: Get all invites sent to them
 * GET /api/collaborations/invites/received
 */
export const getReceivedInvites = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);
    if (user?.role !== "influencer") {
      return res
        .status(403)
        .json({ message: "Only influencers can view received invites" });
    }

    const invites = await DiscoverInviteModel.find({
      influencerId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch brand info for each invite
    const invitesWithBrandInfo = await Promise.all(
      invites.map(async (invite: any) => {
        const brand = await UserModel.findById(invite.brandId).select(
          "_id name avatar"
        );

        return {
          ...invite,
          brand: {
            id: brand?._id,
            name: brand?.name,
            avatar: brand?.avatar,
          },
        };
      })
    );

    return res.status(200).json({
      invites: invitesWithBrandInfo,
    });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATOR: Accept invite as-is
 * POST /api/collaborations/invites/:id/accept
 */
export const acceptInvite = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { inviteId } = req.params;

    const invite = await DiscoverInviteModel.findOne({
      _id: String(inviteId),
      influencerId: userId,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({
        message: `Cannot accept invite with status: ${invite.status}`,
      });
    }

    // Create or find conversation
    const conversation = await findOrCreateDirectConversation(
      String(invite.brandId),
      userId
    );

    // Create promotion from invite
    const campaign = await CampaignModel.findById(invite.campaignId).lean();

    const promotion = await PromotionModel.create({
      sourceInviteId: String(invite._id),
      campaignId: String(invite.campaignId),
      brandId: String(invite.brandId),
      influencerId: userId,
      campaignTitle: invite.campaignTitle,
      product: invite.campaignTitle,
      campaignGoal: "awareness",
      deliverables: invite.deliverables,
      draftDueAt: invite.timeline?.draftDueDate || new Date(),
      postAt: invite.timeline?.postingEndDate || new Date(),
      paymentAmount: invite.compensation?.amount || 0,
      advanceAmount: 0,
      paymentDueAt: invite.timeline?.postingEndDate || new Date(),
      paymentMethod: "direct",
      status: "accepted",
    });

    // Increment acceptedCreators on campaign
    await CampaignModel.updateOne(
      { _id: String(invite.campaignId) },
      { $inc: { acceptedCreators: 1 } }
    );

    // Update invite & conversation
    invite.status = "accepted";
    invite.conversationId = String(conversation._id);
    invite.promotionId = String(promotion._id);
    await invite.save();

    await ConversationModel.updateOne(
      { _id: conversation._id },
      { promotionId: String(promotion._id), threadType: "collaboration" }
    );

    // Send system message in chat
    await MessageModel.create({
      conversationId: String(conversation._id),
      senderId: userId,
      messageType: "system",
      text: `Accepted collaboration invite for ${invite.campaignTitle}`,
    });

    return res.status(200).json({
      message: "Invite accepted",
      promotion: {
        _id: promotion._id,
        status: promotion.status,
      },
      conversation: {
        _id: conversation._id,
      },
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATOR: Counter invite with modified terms
 * POST /api/collaborations/invites/:id/counter
 */
export const counterInvite = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { inviteId } = req.params;
    const { deliverables, compensation, timeline, message } = req.body;

    const invite = await DiscoverInviteModel.findOne({
      _id: String(inviteId),
      influencerId: userId,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (!["pending", "counter_offered"].includes(invite.status)) {
      return res.status(400).json({
        message: "Can only counter pending or previously countered invites",
      });
    }

    // Create counter offer
    const counterOffer: ICounterOffer = {
      createdBy: "creator",
      message: String(message || "").trim(),
      deliverables: deliverables || invite.deliverables,
      compensation: compensation || invite.compensation,
      timeline: timeline || invite.timeline,
    };

    // Add to history and set as active
    invite.counterOffers.push(counterOffer);
    invite.activeCounterOffer = counterOffer;
    invite.status = "counter_offered";
    await invite.save();

    // Create or find conversation
    let conversation = invite.conversationId
      ? await ConversationModel.findOne({
        _id: invite.conversationId,
      })
      : null;

    if (!conversation) {
      const newConversation = await findOrCreateDirectConversation(
        String(invite.brandId),
        userId
      );
      invite.conversationId = String(newConversation._id);
      await invite.save();
      conversation = newConversation;
    }

    // Send counter offer message
    await MessageModel.create({
      conversationId: String(invite.conversationId),
      senderId: userId,
      messageType: "counter_offer",
      text: message || undefined,
      offerData: {
        inviteId: String(invite._id),
        campaignId: String(invite.campaignId),
        campaignTitle: invite.campaignTitle,
        paymentAmount:
          compensation?.amount ||
          compensation?.minAmount ||
          invite.compensation?.amount ||
          0,
        note: message || "",
      },
    });

    return res.status(200).json({
      message: "Counter offer sent",
      invite: {
        _id: invite._id,
        status: invite.status,
        activeCounterOffer: invite.activeCounterOffer,
      },
      conversation: {
        _id: invite.conversationId,
      },
    });
  } catch (error) {
    console.error("Error countering invite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATOR: Ask question about invite
 * POST /api/collaborations/invites/:id/ask-question
 */
export const askQuestion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { inviteId } = req.params;
    const { question } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const invite = await DiscoverInviteModel.findOne({
      _id: String(inviteId),
      influencerId: userId,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Create or find conversation
    let conversation = invite.conversationId
      ? await ConversationModel.findOne({
        _id: invite.conversationId,
      })
      : null;

    if (!conversation) {
      const newConversation = await findOrCreateDirectConversation(
        String(invite.brandId),
        userId
      );
      invite.conversationId = String(newConversation._id);
      await invite.save();
      conversation = newConversation;
    }

    // Send question message
    await MessageModel.create({
      conversationId: String(invite.conversationId),
      senderId: userId,
      messageType: "text",
      text: question,
    });

    return res.status(200).json({
      message: "Question sent",
      conversation: {
        _id: invite.conversationId,
      },
    });
  } catch (error) {
    console.error("Error asking question:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATOR: Decline invite
 * POST /api/collaborations/invites/:id/decline
 */
export const declineInvite = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = getRequestUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { inviteId } = req.params;
    const { reason } = req.body;

    const query: any = { _id: String(inviteId) };
    if (user.role === "influencer") {
      query.influencerId = user.id;
    } else {
      query.brandId = user.id;
    }

    const invite = await DiscoverInviteModel.findOne(query);

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (!["pending", "counter_offered"].includes(invite.status)) {
      return res
        .status(400)
        .json({ message: "Can only decline pending or countered invites" });
    }

    invite.status = "declined";
    invite.declineReason = String(reason || "").trim();
    await invite.save();

    // Decrement invitedCreators on campaign
    await CampaignModel.updateOne(
      { _id: String(invite.campaignId) },
      { $inc: { invitedCreators: -1 } }
    );

    return res.status(200).json({
      message: "Invite declined",
    });
  } catch (error) {
    console.error("Error declining invite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * BRAND: Accept counter offer
 * POST /api/collaborations/invites/:id/accept-counter
 */
export const acceptCounterOffer = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id || requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can accept counters" });
    }

    const { inviteId } = req.params;

    const invite = await DiscoverInviteModel.findOne({
      _id: String(inviteId),
      brandId: requester.id,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "counter_offered" || !invite.activeCounterOffer) {
      return res
        .status(400)
        .json({ message: "No active counter offer to accept" });
    }

    // Create or find conversation
    let conversation = invite.conversationId
      ? await ConversationModel.findOne({
        _id: invite.conversationId,
      })
      : null;

    if (!conversation) {
      const newConversation = await findOrCreateDirectConversation(
        requester.id,
        String(invite.influencerId)
      );
      invite.conversationId = String(newConversation._id);
      conversation = newConversation;
    }

    // Create promotion with counter offer terms
    const promotion = await PromotionModel.create({
      sourceInviteId: String(invite._id),
      campaignId: String(invite.campaignId),
      brandId: requester.id,
      influencerId: String(invite.influencerId),
      campaignTitle: invite.campaignTitle,
      product: invite.campaignTitle,
      campaignGoal: "awareness",
      deliverables: invite.activeCounterOffer?.deliverables || invite.deliverables,
      draftDueAt:
        invite.activeCounterOffer?.timeline?.draftDueDate ||
        invite.timeline?.draftDueDate ||
        new Date(),
      postAt:
        invite.activeCounterOffer?.timeline?.postingEndDate ||
        invite.timeline?.postingEndDate ||
        new Date(),
      paymentAmount:
        invite.activeCounterOffer?.compensation?.amount ||
        invite.activeCounterOffer?.compensation?.minAmount ||
        invite.compensation?.amount ||
        0,
      advanceAmount: 0,
      paymentDueAt:
        invite.activeCounterOffer?.timeline?.postingEndDate ||
        invite.timeline?.postingEndDate ||
        new Date(),
      paymentMethod: "direct",
      status: "accepted",
    });

    // Increment acceptedCreators on campaign
    await CampaignModel.updateOne(
      { _id: String(invite.campaignId) },
      { $inc: { acceptedCreators: 1 } }
    );

    // Update invite & conversation
    invite.status = "accepted";
    invite.promotionId = String(promotion._id);
    await invite.save();

    if (invite.conversationId) {
      await ConversationModel.updateOne(
        { _id: invite.conversationId },
        { promotionId: String(promotion._id), threadType: "collaboration" }
      );
    }

    // Send system message
    await MessageModel.create({
      conversationId: String(invite.conversationId),
      senderId: requester.id,
      messageType: "system",
      text: `Accepted counter offer for ${invite.campaignTitle}`,
    });

    return res.status(200).json({
      message: "Counter offer accepted",
      promotion: {
        _id: promotion._id,
        status: promotion.status,
      },
    });
  } catch (error) {
    console.error("Error accepting counter offer:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * BRAND: Counter the creator's counter
 * POST /api/collaborations/invites/:id/brand-counter
 */
export const brandCounterOffer = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const requester = getRequestUser(req);
    if (!requester?.id || requester.role !== "brand") {
      return res.status(403).json({ message: "Only brands can send counters" });
    }

    const { inviteId } = req.params;
    const { deliverables, compensation, timeline, message } = req.body;

    const invite = await DiscoverInviteModel.findOne({
      _id: String(inviteId),
      brandId: requester.id,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "counter_offered") {
      return res
        .status(400)
        .json({
          message: "Can only counter when creator has sent a counter offer",
        });
    }

    // Create brand's counter offer
    const counterOffer: ICounterOffer = {
      createdBy: "brand",
      message: String(message || "").trim(),
      deliverables: deliverables || invite.deliverables,
      compensation: compensation || invite.compensation,
      timeline: timeline || invite.timeline,
    };

    // Add to history and set as active
    invite.counterOffers.push(counterOffer);
    invite.activeCounterOffer = counterOffer;
    await invite.save();

    // Create or find conversation
    let conversation = invite.conversationId
      ? await ConversationModel.findOne({
        _id: invite.conversationId,
      })
      : null;

    if (!conversation) {
      const newConversation = await findOrCreateDirectConversation(
        requester.id,
        String(invite.influencerId)
      );
      invite.conversationId = String(newConversation._id);
      await invite.save();
      conversation = newConversation;
    }

    // Send counter offer message
    await MessageModel.create({
      conversationId: String(invite.conversationId),
      senderId: requester.id,
      messageType: "counter_offer",
      text: message || undefined,
      offerData: {
        inviteId: String(invite._id),
        campaignId: String(invite.campaignId),
        campaignTitle: invite.campaignTitle,
        paymentAmount:
          compensation?.amount ||
          compensation?.minAmount ||
          invite.compensation?.amount ||
          0,
        note: message || "",
      },
    });

    return res.status(200).json({
      message: "Counter offer sent",
      invite: {
        _id: invite._id,
        status: invite.status,
        activeCounterOffer: invite.activeCounterOffer,
      },
    });
  } catch (error) {
    console.error("Error sending brand counter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};