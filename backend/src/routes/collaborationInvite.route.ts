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
} from "../controllers/collaborationInvite.controller";
import { authMiddleware } from "../middleware/auth";

const collaborationRouter = express.Router();

collaborationRouter.use(authMiddleware);

// Brand endpoints
collaborationRouter.post("/invites", createCollaborationInvite);
collaborationRouter.post("/invites/:inviteId/accept-counter", acceptCounterOffer);
collaborationRouter.post("/invites/:inviteId/brand-counter", brandCounterOffer);

// Creator endpoints
collaborationRouter.get("/invites/received", getReceivedInvites);
collaborationRouter.post("/invites/:inviteId/accept", acceptInvite);
collaborationRouter.post("/invites/:inviteId/counter", counterInvite);
collaborationRouter.post("/invites/:inviteId/ask-question", askQuestion);
collaborationRouter.post("/invites/:inviteId/decline", declineInvite);

export default collaborationRouter;