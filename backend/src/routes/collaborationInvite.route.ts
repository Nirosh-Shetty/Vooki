import express from "express";
import {
  createCollaborationInvite,
  getReceivedInvites,
  acceptInvite,
  counterInvite,
  askQuestion,
  declineInvite,
  acceptCounterOffer,
  brandCounterOffer,
  getBrandInvites,
} from "../controllers/collaborationInvite.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const collaborationRouter = express.Router();

collaborationRouter.use(authMiddleware);

// Brand endpoints
collaborationRouter.get("/invites", requireRole("brand", "manager"), getBrandInvites);
collaborationRouter.post("/invites", requireRole("brand", "manager"), createCollaborationInvite);
collaborationRouter.post("/invites/:inviteId/accept-counter", requireRole("brand", "manager"), acceptCounterOffer);
collaborationRouter.post("/invites/:inviteId/brand-counter", requireRole("brand", "manager"), brandCounterOffer);

// Creator endpoints
collaborationRouter.get("/invites/received", requireRole("influencer"), getReceivedInvites);
collaborationRouter.post("/invites/:inviteId/accept", requireRole("influencer"), acceptInvite);
collaborationRouter.post("/invites/:inviteId/counter", requireRole("influencer"), counterInvite);
collaborationRouter.post("/invites/:inviteId/ask-question", requireRole("influencer"), askQuestion);
collaborationRouter.post("/invites/:inviteId/decline", requireRole("influencer"), declineInvite);

export default collaborationRouter;