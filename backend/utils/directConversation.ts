import ConversationModel from "../models/Conversation";
import MessageModel from "../models/Message";

export const buildConversationParticipants = (userId: string, otherUserId: string) =>
  [String(userId), String(otherUserId)].sort();

const clearLegacyConversationContext = (conversation: any) => {
  conversation.threadType = "direct";
  conversation.campaignId = "";
  conversation.promotionId = "";
  conversation.campaignTitle = "";
};

export const reconcileDirectConversationThreads = async (participants: string[]) => {
  const normalizedParticipants = participants.map(String).sort();
  const conversations = await ConversationModel.find({
    participants: normalizedParticipants,
  }).sort({ lastMessageAt: -1, createdAt: 1 });

  if (!conversations.length) return null;

  const primary =
    conversations.find(
      (conversation) =>
        !String(conversation.campaignId || "") && !String(conversation.promotionId || "")
    ) || conversations[0];

  let primaryChanged = false;
  if (
    primary.threadType !== "direct" ||
    String(primary.campaignId || "") ||
    String(primary.promotionId || "") ||
    String(primary.campaignTitle || "")
  ) {
    clearLegacyConversationContext(primary);
    primaryChanged = true;
  }

  const primaryId = String(primary._id);

  for (const conversation of conversations) {
    if (String(conversation._id) === primaryId) continue;

    const duplicateId = String(conversation._id);
    await MessageModel.updateMany(
      { conversationId: duplicateId },
      { $set: { conversationId: primaryId } }
    );

    if (
      conversation.lastMessageAt &&
      (!primary.lastMessageAt || conversation.lastMessageAt > primary.lastMessageAt)
    ) {
      primary.lastMessage = conversation.lastMessage || primary.lastMessage || "";
      primary.lastMessageId = conversation.lastMessageId || primary.lastMessageId || "";
      primary.lastMessageAt = conversation.lastMessageAt;
      primaryChanged = true;
    }

    if (primary.status !== "active" && conversation.status === "active") {
      primary.status = "active";
      primaryChanged = true;
    }

    await conversation.deleteOne();
  }

  if (primaryChanged) {
    await primary.save();
  }

  return primary;
};

export const findOrCreateDirectConversation = async (userId: string, otherUserId: string) => {
  const participants = buildConversationParticipants(userId, otherUserId);
  const existingConversation = await reconcileDirectConversationThreads(participants);
  if (existingConversation) return existingConversation;

  return ConversationModel.create({
    participants,
    status: "active",
    threadType: "direct",
    campaignId: "",
    promotionId: "",
    campaignTitle: "",
  });
};

export const reconcileDirectConversationsForUser = async (userId: string) => {
  const conversations = await ConversationModel.find({
    participants: String(userId),
  })
    .select({ participants: 1 })
    .lean();

  const seenPairs = new Set<string>();
  for (const conversation of conversations) {
    const participants = Array.isArray(conversation.participants)
      ? conversation.participants.map(String).sort()
      : [];
    if (participants.length < 2) continue;

    const pairKey = participants.join(":");
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    await reconcileDirectConversationThreads(participants);
  }
};
