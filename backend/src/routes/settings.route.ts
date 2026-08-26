import express from "express";
import { updateInfluencerSettings } from "../controllers/settings.controller";
import { authMiddleware } from "../middleware/auth";

const settingsRouter = express.Router();

settingsRouter.use(authMiddleware);

settingsRouter.patch("/influencer", updateInfluencerSettings);

export default settingsRouter;
