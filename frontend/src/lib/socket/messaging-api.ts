/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import axios, { AxiosInstance } from "axios";

interface ConversationData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt?: string;
  status: "active" | "archived" | "closed";
  isStoppedByBrand?: boolean;
  stoppedBy?: string | null;
  stoppedAt?: string | null;
  unreadCount: number;
  threadType: "direct" | "campaign" | "collaboration";
  campaignId?: string;
  promotionId?: string;
  inviteId?: string;
  invites?: Record<string, { id: string; status: string; campaignId: string; }>;
  campaignTitle?: string;
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
    campaignId?: string;
    promotionId?: string;
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

  async getOrCreateConversation(otherUserId: string, options?: { campaignId?: string; promotionId?: string; campaignTitle?: string }) {
    try {
      const response = await this.api.post<{ conversation: ConversationData }>(
        "/conversations",
        { otherUserId, ...options }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting/creating conversation:", error);
      throw error;
    }
  }

  async markAsRead(conversationId: string) {
    try {
      const response = await this.api.post("/mark-as-read", {
        conversationId,
      });
      return response.data;
    } catch (error) {
      console.warn("Mark as read API notice:", error);
      return null;
    }
  }

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

  async deleteEmptyConversation(conversationId: string) {
    try {
      const response = await this.api.delete(`/conversations/${conversationId}/empty`);
      return response.data;
    } catch (error) {
      console.warn("Delete empty conversation notice:", error);
      return null;
    }
  }

  async toggleStopCreatorMessages(conversationId: string, stopped?: boolean) {
    try {
      const response = await this.api.post<{
        message: string;
        isStoppedByBrand: boolean;
        stoppedBy?: string;
        stoppedAt?: string;
      }>(`/conversations/${conversationId}/toggle-stop`, {
        stopped,
      });
      return response.data;
    } catch (error) {
      console.error("Error toggling creator messages:", error);
      throw error;
    }
  }
}

export const messagingAPI = new MessagingAPI();
