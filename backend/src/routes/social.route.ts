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

const socialRouter = express.Router();

socialRouter.post("/connect", authMiddleware, connectSocialAccount);
socialRouter.get("/connect/youtube", authMiddleware, startYoutubeConnect);
socialRouter.get("/connect/youtube/callback", handleYoutubeCallback);
socialRouter.get("/connect/instagram", authMiddleware, startInstagramConnect);
socialRouter.get("/connect/instagram/callback", handleInstagramCallback);
socialRouter.patch("/metrics", authMiddleware, updateSocialMetrics);
socialRouter.get("/connections", authMiddleware, getSocialConnections);

export default socialRouter;
