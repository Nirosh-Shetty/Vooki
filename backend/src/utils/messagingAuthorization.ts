import UserModel from "../models/Users";
import ConversationModel from "../models/Conversation";
import DiscoverInviteModel from "../models/DiscoverInvite";
import PromotionModel from "../models/Promotion";

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requesterRole?: string;
  targetRole?: string;
  conversation?: any;
}

/**
 * Validates whether a user can initiate or open a conversation with a target user.
 * Rules:
 * 1. Creators cannot message other creators.
 * 2. Creators can only message brands after receiving an invite or when contact is initiated by the brand.
 * 3. Brands can initiate conversations with creators.
 */
export const canInitiateConversation = async (
  requesterId: string,
  targetUserId: string
): Promise<AuthorizationResult> => {
  if (requesterId === targetUserId) {
    return { allowed: false, reason: "You cannot start a conversation with yourself." };
  }

  const [requester, targetUser] = await Promise.all([
    UserModel.findById(requesterId, { role: 1, name: 1 }).lean(),
    UserModel.findById(targetUserId, { role: 1, name: 1 }).lean(),
  ]);

  if (!requester || !targetUser) {
    return { allowed: false, reason: "User not found." };
  }

  // Rule 3: Creators cannot message other creators
  if (requester.role === "influencer" && targetUser.role === "influencer") {
    return {
      allowed: false,
      reason: "Creators cannot message other creators on Vooki.",
      requesterRole: requester.role,
      targetRole: targetUser.role,
    };
  }

  // Rule 1 & 2: Creators cannot cold-message brands without an invite or prior brand initiation
  if (requester.role === "influencer" && targetUser.role === "brand") {
    // Check if an invite exists from brand to influencer
    const hasInvite = await DiscoverInviteModel.exists({
      brandId: targetUserId,
      influencerId: requesterId,
    });

    if (hasInvite) {
      return { allowed: true, requesterRole: requester.role, targetRole: targetUser.role };
    }

    // Check if a promotion workspace exists
    const hasPromotion = await PromotionModel.exists({
      brandId: targetUserId,
      influencerId: requesterId,
    });

    if (hasPromotion) {
      return { allowed: true, requesterRole: requester.role, targetRole: targetUser.role };
    }

    // Check if there is an existing conversation already initiated by the brand
    const existingConversation = await ConversationModel.findOne({
      participants: { $all: [String(requesterId), String(targetUserId)] },
    }).lean();

    if (existingConversation) {
      return { allowed: true, requesterRole: requester.role, targetRole: targetUser.role };
    }

    return {
      allowed: false,
      reason: "Creators can only message brands after receiving an invite or when the brand initiates contact.",
      requesterRole: requester.role,
      targetRole: targetUser.role,
    };
  }

  // Brands and managers can initiate conversations with creators
  return {
    allowed: true,
    requesterRole: requester.role,
    targetRole: targetUser.role,
  };
};

/**
 * Validates whether a user can send a message in an existing conversation.
 * Rules:
 * 1. User must be a participant.
 * 2. Creator-to-creator conversations cannot have messages.
 */
export const canSendMessageInConversation = async (
  userId: string,
  conversationId: string
): Promise<AuthorizationResult> => {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    return { allowed: false, reason: "Conversation not found." };
  }

  if (!conversation.participants.includes(String(userId))) {
    return { allowed: false, reason: "Unauthorized: You are not a participant in this conversation." };
  }

  // Fetch participant roles
  const users = await UserModel.find(
    { _id: { $in: conversation.participants } },
    { role: 1 }
  ).lean();

  const areAllParticipantsCreators =
    users.length >= 2 && users.every((u) => u.role === "influencer");

  // Rule 2: Prohibit creator-to-creator messaging
  if (areAllParticipantsCreators) {
    return {
      allowed: false,
      reason: "Creator-to-creator messaging is prohibited on Vooki.",
      conversation,
    };
  }

  return {
    allowed: true,
    conversation,
  };
};


