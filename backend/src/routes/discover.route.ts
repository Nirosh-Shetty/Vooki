import express from "express";
import {
  addToDiscoverShortlist,
  createDiscoverInvites,
  getBrandNetwork,
  getDiscoverInfluencers,
  getDiscoverInvites,
  getDiscoverShortlist,
  removeFromDiscoverShortlist,
  respondToDiscoverInvite,
} from "../controllers/discover.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const discoverRouter = express.Router();

discoverRouter.use(authMiddleware);
discoverRouter.get("/influencers", requireRole("brand", "manager"), getDiscoverInfluencers);
discoverRouter.get("/shortlist", requireRole("brand", "manager"), getDiscoverShortlist);
discoverRouter.post("/shortlist", requireRole("brand", "manager"), addToDiscoverShortlist);
discoverRouter.delete("/shortlist/:influencerId", requireRole("brand", "manager"), removeFromDiscoverShortlist);
discoverRouter.post("/invites", requireRole("brand", "manager"), createDiscoverInvites);
discoverRouter.get("/invites", requireRole("brand", "manager"), getDiscoverInvites);
discoverRouter.patch("/invites/:inviteId/respond", requireRole("influencer"), respondToDiscoverInvite);
discoverRouter.get("/network", requireRole("brand", "manager"), getBrandNetwork);

export default discoverRouter;
