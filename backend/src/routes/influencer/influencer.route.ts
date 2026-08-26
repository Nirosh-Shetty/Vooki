import express from "express";
import {
  addFeaturedContent,
  deleteFeaturedContent,
  getFeaturedContent,
  updateFeaturedContent,
} from "../../controllers/influencer/feature.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";
import { getUsernameAvailability } from "../../controllers/influencer/username.controller";

const influencerRouter = express.Router();

influencerRouter.use(authMiddleware, requireRole("influencer"));

influencerRouter.get("/featureContent", getFeaturedContent);
influencerRouter.post("/featureContent", addFeaturedContent);
influencerRouter.put("/featureContent", updateFeaturedContent);
influencerRouter.delete("/featureContent/:contentId", deleteFeaturedContent);
influencerRouter.get("/check-username/:username", getUsernameAvailability);

export default influencerRouter;