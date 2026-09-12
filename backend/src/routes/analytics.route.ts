import { Router } from "express";
import { getCreatorAnalytics, getBrandAnalytics } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// Creator analytics — full aggregated payload
router.get("/creator/me", getCreatorAnalytics);

// Brand analytics — fetches campaigns, promotions, and payments
router.get("/brand/me", getBrandAnalytics);

export default router;
