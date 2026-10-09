import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import profilesRouter from "./profiles.js";
import moderationRouter from "./moderation.js";
import adminRouter from "./admin.js";
import membershipRouter from "./membership.js";
import memberRouter from "./member.js";
import communityRouter from "./community.js";
import communityModerationRouter from "./community-moderation.js";
import chatRouter from "./chat.js";
import eventsRouter from "./events.js";
import eventModerationRouter from "./event-moderation.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(membershipRouter);
router.use(memberRouter);
router.use(chatRouter);
router.use(eventsRouter);
router.use(profilesRouter);
router.use(communityRouter);
router.use(moderationRouter);
router.use(communityModerationRouter);
router.use(eventModerationRouter);

export default router;
