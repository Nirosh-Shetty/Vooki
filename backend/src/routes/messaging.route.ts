import express from "express";
import {
  getConversations,
  getMessages,
  getOrCreateConversation,
  markMessagesAsRead,
  searchMessaging,
  archiveConversation,
} from "../controllers/messaging/messaging.controller";
import { authMiddleware } from "../middleware/auth";

const messagingRouter = express.Router();

// Apply auth middleware to all routes
messagingRouter.use(authMiddleware);

// Conversation routes
messagingRouter.get("/conversations", getConversations);
messagingRouter.post("/conversations", getOrCreateConversation);
messagingRouter.post("/conversations/archive", archiveConversation);

// Message routes
messagingRouter.get("/conversations/:conversationId/messages", getMessages);
messagingRouter.post("/mark-as-read", markMessagesAsRead);

// Search routes
messagingRouter.get("/search", searchMessaging);

export default messagingRouter;
