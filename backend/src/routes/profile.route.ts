import express from "express";
import {
  getPublicInfluencerProfile,
  profile,
  updateBrandProfile,
  updateInfluencerProfile,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth";

const profileRouter = express.Router();

profileRouter.get("/public/:userId", getPublicInfluencerProfile);
profileRouter.get("/me", authMiddleware, profile);
profileRouter.patch("/influencer", authMiddleware, updateInfluencerProfile);
profileRouter.patch("/brand", authMiddleware, updateBrandProfile);

export default profileRouter;
