import express from "express";
import authRouter from "./auth.route";
import campaignRouter from "./campaign.route";
import discoverRouter from "./discover.route";
import earningsRouter from "./earnings.route";
import paymentsRouter from "./payments.route";
import profileRouter from "./profile.route";
import promotionRouter from "./promotion.route";
import socialRouter from "./social.route";
import collaborationRouter from "./collaborationInvite.route";
import influencerRouter from "./influencer/influencer.route";
import settingsRouter from "./settings.route";
import analyticsRouter from "./analytics.route";
const router = express.Router();

router.use("/analytics", analyticsRouter);
router.use("/auth", authRouter);
router.use("/campaigns", campaignRouter);
router.use("/discover", discoverRouter);
router.use("/earnings", earningsRouter);
router.use("/payments", paymentsRouter);
router.use("/profile", profileRouter);
router.use("/promotions", promotionRouter);
router.use("/social", socialRouter);
router.use("/collaborations", collaborationRouter);
router.use("/influencer", influencerRouter);
router.use("/settings", settingsRouter);

export default router;
