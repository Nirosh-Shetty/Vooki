import express from "express";
import { authMiddleware } from "../middleware/auth";
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
campaignRouter.post("/", createCampaign);
campaignRouter.get("/:campaignId", getCampaignById);
campaignRouter.patch("/:campaignId", updateCampaign);
campaignRouter.patch("/:campaignId/status", updateCampaignStatus);

export default campaignRouter;
