/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "./socket-context";

export interface OfferData {
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  deliverableSummary?: string;
  paymentAmount?: number;
  advanceAmount?: number;
  draftDueAt?: string | Date | null;
  postAt?: string | Date | null;
  hashtags?: string[];
  discountCode?: string;
  note?: string;
}

export interface Message {
  id: string;
  sender?: {
    name: string;
    username: string;
    profilePicture: string;
  };
  senderId: string;
  messageType?: "text" | "offer" | "counter_offer" | "system";
  text?: string;
  offerData?: OfferData | null;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface SendMessageOptions {
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  messageType?: "text" | "offer" | "counter_offer" | "system";
  offerData?: OfferData | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt?: Date;
  status: "active" | "archived" | "closed";
  unreadCount: number;
  threadType: "direct" | "campaign" | "collaboration";
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  otherUser?: {
    name: string;
    username: string;
    profilePicture: string;
    role: string;
  };
}

export const useMessaging = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) {
        console.warn("Socket not connected");
        return;
      }

      setIsLoading(true);
      socket.emit(
        "join-conversation",
        { conversationId },
        (response: any) => {
          if (response.success) {
            setIsLoading(false);
          } else {
            setError(response.message);
            setIsLoading(false);
          }
        }
      );
    },
    [socket, isConnected]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!socket) return;
      socket.emit("leave-conversation", { conversationId });
    },
    [socket]
  );

  const sendMessage = useCallback(
    (
      conversationId: string,
      text?: string,
      options?: SendMessageOptions
    ) => {
      if (!socket) {
        setError("Socket not initialized");
        return Promise.reject(new Error("Socket not initialized"));
      }

      if (!isConnected) {
        setError("Socket not connected");
        return Promise.reject(new Error("Socket not connected"));
      }

      return new Promise((resolve, reject) => {
        socket.emit(
          "send-message",
          {
            conversationId,
            text,
            mediaUrl: options?.mediaUrl,
            mediaType: options?.mediaType,
            messageType: options?.messageType,
            offerData: options?.offerData,
          },
          (response: any) => {
            if (!response.success) {
              setError(response.message);
              reject(new Error(response.message || "Message send failed"));
            } else {
              resolve(response.message);
            }
          }
        );
      });
    },
    [socket, isConnected]
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;

      socket.emit(
        "mark-as-read",
        { conversationId },
        (response: any) => {
          if (!response.success) {
            console.error("Mark as read failed:", response.message);
          }
        }
      );
    },
    [socket, isConnected]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("error", (socketError: any) => {
      console.error("Socket error:", socketError);
      setError(socketError.message);
    });

    return () => {
      socket.off("error");
    };
  }, [socket]);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
  };
};
