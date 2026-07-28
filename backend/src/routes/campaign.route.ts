import express from "express";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  updateCampaignStatus,
} from "../controllers/campaign.controller";

const campaignRouter = express.Router();

campaignRouter.use(authMiddleware);

campaignRouter.get("/", listCampaigns);
campaignRouter.post("/", requireRole("brand", "manager"), createCampaign);
campaignRouter.get("/:campaignId", requireRole("brand", "manager", "influencer"), getCampaignById);
campaignRouter.patch("/:campaignId", requireRole("brand", "manager"), updateCampaign);
campaignRouter.patch("/:campaignId/status", requireRole("brand", "manager"), updateCampaignStatus);

export default campaignRouter;
