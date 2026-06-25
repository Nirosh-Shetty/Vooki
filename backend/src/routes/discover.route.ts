import express from "express";
import {
  addToDiscoverShortlist,
  createDiscoverInvites,
  getDiscoverInfluencers,
  getDiscoverInvites,
  getDiscoverShortlist,
  removeFromDiscoverShortlist,
  respondToDiscoverInvite,
} from "../controllers/discover.controller";
import { authMiddleware } from "../middleware/auth";

const discoverRouter = express.Router();

discoverRouter.use(authMiddleware);
discoverRouter.get("/influencers", getDiscoverInfluencers);
discoverRouter.get("/shortlist", getDiscoverShortlist);
discoverRouter.post("/shortlist", addToDiscoverShortlist);
discoverRouter.delete("/shortlist/:influencerId", removeFromDiscoverShortlist);
discoverRouter.post("/invites", createDiscoverInvites);
discoverRouter.get("/invites", getDiscoverInvites);
discoverRouter.patch("/invites/:inviteId/respond", respondToDiscoverInvite);

export default discoverRouter;
