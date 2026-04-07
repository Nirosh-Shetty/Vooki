import express from "express";
import authRouter from "./auth.route";
import campaignRouter from "./campaign.route";
import discoverRouter from "./discover.route";
import earningsRouter from "./earnings.route";
import paymentsRouter from "./payments.route";
import profileRouter from "./profile.route";
import promotionRouter from "./promotion.route";
import socialRouter from "./social.route";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/campaigns", campaignRouter);
router.use("/discover", discoverRouter);
router.use("/earnings", earningsRouter);
router.use("/payments", paymentsRouter);
router.use("/profile", profileRouter);
router.use("/promotions", promotionRouter);
router.use("/social", socialRouter);

export default router;
