import express from "express";
import {
  connectSocialAccount,
  getConnectedAccounts,
  getSocialConnections,
  handleInstagramCallback,
  handleYoutubeCallback,
  handleYoutubeDisconnect,
  startInstagramConnect,
  startYoutubeConnect,
  updateSocialMetrics,
} from "../controllers/social.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const socialRouter = express.Router();

socialRouter.post("/connect", authMiddleware, requireRole("influencer"), connectSocialAccount);
socialRouter.get("/connect/youtube", authMiddleware, requireRole("influencer"), startYoutubeConnect);
socialRouter.delete("/connect/youtube", authMiddleware, requireRole("influencer"), handleYoutubeDisconnect);
socialRouter.get("/connect/youtube/callback", handleYoutubeCallback);
socialRouter.get("/connect/instagram", authMiddleware, requireRole("influencer"), startInstagramConnect);
socialRouter.get("/connect/instagram/callback", handleInstagramCallback);
socialRouter.patch("/metrics", authMiddleware, requireRole("influencer"), updateSocialMetrics);
socialRouter.get("/connections", authMiddleware, requireRole("influencer"), getSocialConnections);
socialRouter.get("/connections", authMiddleware, getConnectedAccounts);

export default socialRouter;
