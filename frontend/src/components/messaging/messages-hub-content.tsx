"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessagesHub,
  type HubConversation,
  type HubMessage,
  type RoleVariant,
} from "./messages-hub";
import { useConversations, useMessaging, useConversationMessages, useSocket } from "@/lib/socket";
import { messagingAPI } from "@/lib/socket/messaging-api";

interface MessagesHubContentProps {
  role: RoleVariant;
  heading: string;
  subheading: string;
  composerPlaceholder: string;
}

type StructuredMessageAction = "accept_offer" | "request_changes";

export function MessagesHubContent({
  role,
  heading,
  subheading,
  composerPlaceholder,
}: MessagesHubContentProps) {
  const searchParams = useSearchParams();
  const initialDraft = searchParams?.get("draft") || "";
  const requestedCampaignId = searchParams?.get("campaignId") || "";
  const requestedPromotionId = searchParams?.get("promotionId") || "";
  const requestedCampaignTitle = searchParams?.get("campaignTitle") || "";
  const { conversations, isLoading: conversationsLoading, fetchConversations } = useConversations();
  const { isConnected, userId } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id || null
  );
  const hasHandledQueryRef = useRef(false);

  const {
    messages,
    isLoading: messagesLoading,
    markAsRead,
  } = useConversationMessages(selectedConversationId || undefined);

  const { sendMessage, joinConversation, leaveConversation } = useMessaging();

  useEffect(() => {
    if (selectedConversationId && isConnected) {
      joinConversation(selectedConversationId);
      markAsRead(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, isConnected, joinConversation, leaveConversation, markAsRead]);

  const handleCreateConversation = useCallback(
    async (
      otherUserId: string,
      options?: { campaignId?: string; promotionId?: string; campaignTitle?: string }
    ) => {
      try {
        const response = await messagingAPI.getOrCreateConversation(otherUserId, options);
        const newConversation = response.conversation;
        await fetchConversations();
        setSelectedConversationId(newConversation.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        throw error;
      }
    },
    [fetchConversations]
  );

  const handleStructuredMessageAction = useCallback(
    async (
      action: StructuredMessageAction,
      payload: { conversation: HubConversation; message: HubMessage }
    ) => {
      const { conversation, message } = payload;
      if (!conversation.promotionId) {
        throw new Error("This thread is not linked to a collaboration yet.");
      }

      if (action === "accept_offer") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${conversation.promotionId}/status`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "accepted" }),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Unable to accept this offer");
        }

        try {
          await sendMessage(conversation.id, `Accepted the offer for ${conversation.campaignTitle || "this collaboration"}.`, {
            messageType: "system",
            offerData: {
              campaignTitle: conversation.campaignTitle || message.offerData?.campaignTitle,
              note: `Accepted the offer for ${conversation.campaignTitle || "this collaboration"}.`,
            },
          });
        } catch (sendError) {
          console.error("Accepted offer, but failed to post system update:", sendError);
        }

        await fetchConversations();
        return;
      }

      await sendMessage(conversation.id, undefined, {
        messageType: "counter_offer",
        offerData: {
          campaignTitle: message.offerData?.campaignTitle || conversation.campaignTitle || "",
          deliverableSummary: message.offerData?.deliverableSummary || "",
          paymentAmount: message.offerData?.paymentAmount,
          advanceAmount: message.offerData?.advanceAmount,
          draftDueAt: message.offerData?.draftDueAt || null,
          postAt: message.offerData?.postAt || null,
          hashtags: message.offerData?.hashtags || [],
          discountCode: message.offerData?.discountCode || "",
          note: "I would like to adjust this offer before accepting. Can we align on the details here?",
        },
      });

      await fetchConversations();
    },
    [fetchConversations, sendMessage]
  );

  const messagesByConversation = {
    [selectedConversationId || ""]: messages.map((msg) => ({
      id: msg.id,
      sender: msg.senderId === userId ? ("me" as const) : ("other" as const),
      text: msg.text || "",
      messageType: msg.messageType || "text",
      offerData: msg.offerData || null,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      read: msg.read,
    })),
  };

  const transformedConversations: HubConversation[] = conversations.map((conv) => ({
    id: conv.id,
    name: conv.otherUser?.name || "Unknown",
    context: conv.campaignTitle
      ? `${conv.campaignTitle} - ${conv.threadType === "collaboration" ? "collaboration" : "campaign"}`
      : conv.otherUser?.role || "",
    threadType: conv.threadType,
    campaignId: conv.campaignId,
    promotionId: conv.promotionId,
    campaignTitle: conv.campaignTitle,
    avatar: conv.otherUser?.profilePicture?.substring(0, 2).toUpperCase() || "??",
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString() : "Now",
    unreadCount: conv.unreadCount,
    status: conv.status as "active" | "pending" | "closed",
    online: false,
  }));

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    const requestedConversationId = searchParams?.get("conversationId");
    const otherUserId = searchParams?.get("otherUserId");

    if (requestedConversationId) {
      setSelectedConversationId(requestedConversationId);
      hasHandledQueryRef.current = true;
      return;
    }

    if (!otherUserId || hasHandledQueryRef.current) return;
    if (conversationsLoading) return;

    hasHandledQueryRef.current = true;
    handleCreateConversation(otherUserId, {
      campaignId: requestedCampaignId || undefined,
      promotionId: requestedPromotionId || undefined,
      campaignTitle: requestedCampaignTitle || undefined,
    }).catch((error) => {
      console.error("Failed to open collaboration conversation:", error);
      hasHandledQueryRef.current = false;
    });
  }, [
    searchParams,
    conversationsLoading,
    handleCreateConversation,
    requestedCampaignId,
    requestedPromotionId,
    requestedCampaignTitle,
  ]);

  if (conversationsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <MessagesHub
      role={role}
      heading={heading}
      subheading={subheading}
      composerPlaceholder={composerPlaceholder}
      conversations={transformedConversations}
      messagesByConversation={messagesByConversation}
      selectedConversationId={selectedConversationId}
      onSelectConversation={setSelectedConversationId}
      onSendMessage={(text) => {
        if (!selectedConversationId) return;
        void sendMessage(selectedConversationId, text).catch((sendError) => {
          console.error("Provider failed to send message:", sendError);
        });
      }}
      onStructuredMessageAction={handleStructuredMessageAction}
      onCreateConversation={handleCreateConversation}
      isLoading={messagesLoading}
      initialDraft={initialDraft}
    />
  );
}
