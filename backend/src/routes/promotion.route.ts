import express from "express";
import { authMiddleware } from "../middleware/auth";
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
promotionRouter.post("/", createPromotion);
promotionRouter.get("/:promotionId", getPromotionById);
promotionRouter.patch("/:promotionId/terms", updatePromotionTerms);
promotionRouter.patch("/:promotionId/status", updatePromotionStatus);
promotionRouter.patch("/:promotionId/delivery", submitPromotionDelivery);
promotionRouter.patch("/:promotionId/delivery/review", reviewPromotionDelivery);
promotionRouter.patch("/:promotionId/performance", submitPromotionPerformance);
promotionRouter.patch("/:promotionId/payment", markPromotionPaid);

export default promotionRouter;
