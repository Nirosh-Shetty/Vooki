/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import axios, { AxiosInstance } from "axios";

interface ConversationData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt?: string;
  threadType?: "direct" | "campaign" | "collaboration";
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  status: "active" | "archived" | "closed";
  unreadCount: number;
  otherUser?: {
    name: string;
    username: string;
    profilePicture: string;
    role: string;
  };
}

interface MessageData {
  id: string;
  sender: {
    name: string;
    username: string;
    profilePicture: string;
  };
  senderId: string;
  messageType?: "text" | "offer" | "counter_offer" | "system";
  text?: string;
  offerData?: {
    campaignTitle?: string;
    deliverableSummary?: string;
    paymentAmount?: number;
    advanceAmount?: number;
    draftDueAt?: string;
    postAt?: string;
    hashtags?: string[];
    discountCode?: string;
    note?: string;
  } | null;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface SearchResult {
  messages?: any[];
  users?: any[];
}

class MessagingAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/messaging`,
      withCredentials: true,
    });
  }

  // Get all conversations
  async getConversations(
    page: number = 1,
    limit: number = 20,
    status: "active" | "archived" | "closed" = "active"
  ) {
    try {
      const response = await this.api.get<{
        conversations: ConversationData[];
        total: number;
      }>("/conversations", {
        params: { page, limit, status },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  // Get messages from conversation
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const response = await this.api.get<{
        messages: MessageData[];
        total: number;
      }>(`/conversations/${conversationId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  // Get or create conversation with another user
  async getOrCreateConversation(
    otherUserId: string,
    options?: { campaignId?: string; promotionId?: string; campaignTitle?: string }
  ) {
    try {
      const response = await this.api.post<{ conversation: ConversationData }>(
        "/conversations",
        {
          otherUserId,
          campaignId: options?.campaignId,
          promotionId: options?.promotionId,
          campaignTitle: options?.campaignTitle,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting/creating conversation:", error);
      throw error;
    }
  }

  // Mark messages as read (REST endpoint)
  async markAsRead(conversationId: string) {
    try {
      const response = await this.api.post("/mark-as-read", {
        conversationId,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Search conversations and messages
  async search(query: string, type: "all" | "messages" | "users" = "all") {
    try {
      const response = await this.api.get<SearchResult>("/search", {
        params: { query, type },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching:", error);
      throw error;
    }
  }

  // Archive conversation
  async archiveConversation(conversationId: string) {
    try {
      const response = await this.api.post("/conversations/archive", {
        conversationId,
      });
      return response.data;
    } catch (error) {
      console.error("Error archiving conversation:", error);
      throw error;
    }
  }
}

export const messagingAPI = new MessagingAPI();
