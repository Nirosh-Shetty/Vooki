import { Router } from "express";
import { getCreatorAnalytics } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// Creator analytics — full aggregated payload
router.get("/creator/me", getCreatorAnalytics);

export default router;
