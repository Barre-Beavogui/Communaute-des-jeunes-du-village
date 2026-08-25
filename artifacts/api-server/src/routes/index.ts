import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import moderationRouter from "./moderation";
import adminRouter from "./admin";
import membershipRouter from "./membership";
import memberRouter from "./member";
import communityRouter from "./community";
import communityModerationRouter from "./community-moderation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(membershipRouter);
router.use(memberRouter);
router.use(profilesRouter);
router.use(communityRouter);
router.use(moderationRouter);
router.use(communityModerationRouter);

export default router;
