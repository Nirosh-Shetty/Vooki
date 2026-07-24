import express from "express";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import {
  createPromotion,
  getPromotionById,
  listPromotions,
  markPromotionPaid,
  reviewPromotionDelivery,
  submitPromotionDelivery,
  submitPromotionPerformance,
  updatePromotionStatus,
  updatePromotionTerms,
} from "../controllers/promotion.controller";

const promotionRouter = express.Router();

promotionRouter.use(authMiddleware);

promotionRouter.get("/", listPromotions);
promotionRouter.post("/", requireRole("brand", "manager"), createPromotion);
promotionRouter.get("/:promotionId", requireRole("brand", "manager", "influencer"), getPromotionById);
promotionRouter.patch("/:promotionId/terms", requireRole("brand", "manager"), updatePromotionTerms);
promotionRouter.patch("/:promotionId/status", requireRole("brand", "manager"), updatePromotionStatus);
promotionRouter.patch("/:promotionId/delivery", requireRole("influencer"), submitPromotionDelivery);
promotionRouter.patch("/:promotionId/delivery/review", requireRole("brand", "manager"), reviewPromotionDelivery);
promotionRouter.patch("/:promotionId/performance", requireRole("influencer"), submitPromotionPerformance);
promotionRouter.patch("/:promotionId/payment", requireRole("brand", "manager"), markPromotionPaid);

export default promotionRouter;
