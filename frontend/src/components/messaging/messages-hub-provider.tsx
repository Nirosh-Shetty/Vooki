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

interface MessagesHubProviderProps {
  role: RoleVariant;
  composerPlaceholder: string;
}

type StructuredMessageAction = "accept_offer" | "request_changes";

export function MessagesHubProvider({
  role,
  composerPlaceholder,
}: MessagesHubProviderProps) {
  const searchParams = useSearchParams();
  const initialDraft = searchParams?.get("draft") || "";
  const requestedCampaignId = searchParams?.get("campaignId") || "";
  const requestedPromotionId = searchParams?.get("promotionId") || "";
  const requestedCampaignTitle = searchParams?.get("campaignTitle") || "";

  const { conversations, isLoading: conversationsLoading, fetchConversations, setConversations } = useConversations();
  const { isConnected, userId, socket } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
  const hasHandledQueryRef = useRef(false);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const {
    messages,
    isLoading: messagesLoading,
    markAsRead,
  } = useConversationMessages(selectedConversationId || undefined);

  const { sendMessage, joinConversation, leaveConversation } = useMessaging();

  const clearConversationUnread = useCallback((conversationId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              unreadCount: 0,
              lastMessage: conv.lastMessage,
            }
          : conv
      )
    );
  }, [setConversations]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const prevId = selectedConversationIdRef.current;
      if (prevId && prevId !== id) {
        const prevConv = conversations.find((c) => c.id === prevId);
        // If previous conversation was a direct thread with no messages, clean it up!
        if (
          prevConv &&
          prevConv.threadType === "direct" &&
          !prevConv.lastMessage &&
          !prevConv.campaignId &&
          !prevConv.promotionId
        ) {
          setConversations((prev) => prev.filter((c) => c.id !== prevId));
          messagingAPI.deleteEmptyConversation(prevId).catch(() => {});
        }
      }

      setSelectedConversationId(id || null);
      if (id) {
        clearConversationUnread(id);
        markAsRead(id);
      }
    },
    [clearConversationUnread, markAsRead, conversations, setConversations]
  );

  useEffect(() => {
    if (selectedConversationId) {
      if (isConnected) {
        joinConversation(selectedConversationId);
      }
      markAsRead(selectedConversationId);
      clearConversationUnread(selectedConversationId);
      return () => {
        if (isConnected) {
          leaveConversation(selectedConversationId);
        }
      };
    }
  }, [selectedConversationId, isConnected, joinConversation, leaveConversation, markAsRead, clearConversationUnread]);

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      conversationId: string;
      lastMessage?: string;
      lastMessageAt?: string | Date;
      senderId?: string;
      unreadCount?: number;
    }) => {
      const isCurrentOpen = selectedConversationIdRef.current === update.conversationId;
      if (isCurrentOpen && update.senderId !== userId) {
        markAsRead(update.conversationId);
      }

      setConversations((prevConversations) => {
        const targetConversation = prevConversations.find((conv) => conv.id === update.conversationId);

        if (!targetConversation) {
          void fetchConversations();
          return prevConversations;
        }

        const nextUnreadCount = isCurrentOpen || update.senderId === userId
          ? 0
          : targetConversation.unreadCount + (update.lastMessage ? 1 : 0);

        const updatedConversation = {
          ...targetConversation,
          lastMessage: update.lastMessage !== undefined ? update.lastMessage : targetConversation.lastMessage,
          lastMessageAt: update.lastMessageAt ? new Date(update.lastMessageAt) : targetConversation.lastMessageAt,
          unreadCount: isCurrentOpen ? 0 : (update.unreadCount !== undefined && update.unreadCount > 0 ? update.unreadCount : nextUnreadCount),
        };

        return [updatedConversation, ...prevConversations.filter((conv) => conv.id !== update.conversationId)];
      });
    };

    socket.on("conversation-updated", handleConversationUpdated);

    return () => {
      socket.off("conversation-updated", handleConversationUpdated);
    };
  }, [socket, setConversations, fetchConversations, userId, markAsRead]);

  const handleCreateConversation = useCallback(
    async (
      otherUserId: string,
      options?: { campaignId?: string; promotionId?: string; campaignTitle?: string }
    ) => {
      try {
        const prevId = selectedConversationIdRef.current;
        if (prevId) {
          const prevConv = conversations.find((c) => c.id === prevId);
          if (
            prevConv &&
            prevConv.threadType === "direct" &&
            !prevConv.lastMessage &&
            !prevConv.campaignId &&
            !prevConv.promotionId
          ) {
            messagingAPI.deleteEmptyConversation(prevId).catch(() => {});
          }
        }

        const response = await messagingAPI.getOrCreateConversation(otherUserId, options);
        const newConversation = response.conversation;
        const formattedNewConv: any = {
          ...newConversation,
          lastMessageAt: newConversation.lastMessageAt ? new Date(newConversation.lastMessageAt) : new Date(),
        };

        setConversations((prev) => {
          const filtered = prev.filter(
            (c) =>
              c.id !== newConversation.id &&
              !(
                c.threadType === "direct" &&
                !c.lastMessage &&
                !c.campaignId &&
                !c.promotionId &&
                c.id === prevId
              )
          );
          return [formattedNewConv, ...filtered];
        });

        setSelectedConversationId(newConversation.id);
        clearConversationUnread(newConversation.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        throw error;
      }
    },
    [setConversations, conversations, clearConversationUnread]
  );

  const handleStructuredMessageAction = useCallback(
    async (
      action: StructuredMessageAction,
      payload: { conversation: HubConversation; message: HubMessage }
    ) => {
      const { conversation, message } = payload;
      const activeInviteId = message.offerData?.inviteId || conversation.inviteId;

      if (!conversation.promotionId && !activeInviteId) {
        throw new Error("This thread is not linked to a collaboration yet.");
      }

      if (action === "accept_offer") {
        let endpoint = "";
        
        if (conversation.promotionId) {
          endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions/${conversation.promotionId}/status`;
        } else if (activeInviteId) {
          endpoint = (role === "brand" || role === "manager") 
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${activeInviteId}/accept-counter`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${activeInviteId}/accept`;
        }

        const response = await fetch(endpoint, {
          method: conversation.promotionId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conversation.promotionId ? { status: "accepted" } : {}),
        });
        
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
    },
    [fetchConversations, sendMessage]
  );

function formatWhatsAppTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  if (isYesterday) {
    return "Yesterday";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function formatMessageTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Now";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Now";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

  const messagesByConversation = {
    [selectedConversationId || ""]: messages.map((msg: any) => {
      const msgSenderId = String(msg.senderId || (typeof msg.sender === "object" ? (msg.sender?._id || msg.sender?.id) : msg.sender) || "");
      const currentUserIdStr = String(userId || "");
      const isMe = currentUserIdStr ? msgSenderId === currentUserIdStr : false;

      return {
        id: msg.id || msg._id,
        sender: isMe ? ("me" as const) : ("other" as const),
        text: msg.text || "",
        messageType: msg.messageType || "text",
        offerData: msg.offerData || null,
        timestamp: formatMessageTime(msg.createdAt),
        read: Boolean(msg.read),
      };
    }),
  };

  const transformedConversations: HubConversation[] = conversations.map((conv) => {
    const isSelected = conv.id === selectedConversationId;
    const profilePic =
      conv.otherUser?.profilePicture ||
      (conv.otherUser as any)?.avatar ||
      null;

    return {
      id: conv.id,
      name: conv.otherUser?.name || "Unknown",
      context: conv.campaignTitle
        ? `${conv.campaignTitle} - ${conv.threadType === "collaboration" ? "collaboration" : "campaign"}`
        : conv.otherUser?.role || "",
      threadType: conv.threadType,
      campaignId: conv.campaignId,
      promotionId: conv.promotionId,
      inviteId: conv.inviteId,
      invites: conv.invites,
      campaignTitle: conv.campaignTitle,
      avatar: conv.otherUser?.name?.trim()?.charAt(0)?.toUpperCase() || "?",
      profileURL: profilePic,
      icon: conv.otherUser?.name?.trim()?.charAt(0)?.toUpperCase() || null,
      lastMessage: conv.lastMessage,
      lastMessageAt: formatWhatsAppTime(conv.lastMessageAt),
      unreadCount: isSelected ? 0 : conv.unreadCount,
      status: conv.status as "active" | "pending" | "closed",
      online: false,
    };
  });

  useEffect(() => {
    const requestedConversationId = searchParams?.get("conversationId");
    const otherUserId = searchParams?.get("otherUserId");

    if (requestedConversationId) {
      handleSelectConversation(requestedConversationId);
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
    handleSelectConversation,
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
      composerPlaceholder={composerPlaceholder}
      conversations={transformedConversations}
      messagesByConversation={messagesByConversation}
      selectedConversationId={selectedConversationId}
      onSelectConversation={handleSelectConversation}
      onSendMessage={(text) => {
        if (!selectedConversationId) return;
        clearConversationUnread(selectedConversationId);
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
