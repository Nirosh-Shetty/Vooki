import express from "express";
import {
  addFeaturedContent,
  deleteFeaturedContent,
  getFeaturedContent,
  updateFeaturedContent,
} from "../../controllers/influencer/feature.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";

const influencerRouter = express.Router();

influencerRouter.use(authMiddleware, requireRole("influencer"));

influencerRouter.get("/featureContent", getFeaturedContent);
influencerRouter.post("/featureContent", addFeaturedContent);
influencerRouter.put("/featureContent", updateFeaturedContent);
influencerRouter.delete("/featureContent/:contentId", deleteFeaturedContent);

export default influencerRouter;