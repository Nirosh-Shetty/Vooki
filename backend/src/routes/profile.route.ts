import express from "express";
import {
  getPublicInfluencerProfile,
  profile,
  updateBrandProfile,
  updateInfluencerProfile,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const profileRouter = express.Router();

profileRouter.get("/public/:userId", getPublicInfluencerProfile);
profileRouter.get("/me", authMiddleware, profile);
profileRouter.patch("/influencer", authMiddleware, requireRole("influencer"), updateInfluencerProfile);
profileRouter.patch("/brand", authMiddleware, requireRole("brand", "manager"), updateBrandProfile);

export default profileRouter;
