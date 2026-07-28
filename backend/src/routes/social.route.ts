import express from "express";
import {
  connectSocialAccount,
  getSocialConnections,
  handleInstagramCallback,
  handleYoutubeCallback,
  startInstagramConnect,
  startYoutubeConnect,
  updateSocialMetrics,
} from "../controllers/social.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const socialRouter = express.Router();

socialRouter.post("/connect", authMiddleware, requireRole("influencer"), connectSocialAccount);
socialRouter.get("/connect/youtube", authMiddleware, requireRole("influencer"), startYoutubeConnect);
socialRouter.get("/connect/youtube/callback", handleYoutubeCallback);
socialRouter.get("/connect/instagram", authMiddleware, requireRole("influencer"), startInstagramConnect);
socialRouter.get("/connect/instagram/callback", handleInstagramCallback);
socialRouter.patch("/metrics", authMiddleware, requireRole("influencer"), updateSocialMetrics);
socialRouter.get("/connections", authMiddleware, requireRole("influencer"), getSocialConnections);

export default socialRouter;
