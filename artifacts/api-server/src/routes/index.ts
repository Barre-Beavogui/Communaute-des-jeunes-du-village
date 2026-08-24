import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import moderationRouter from "./moderation";
import adminRouter from "./admin";
import membershipRouter from "./membership";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(membershipRouter);
router.use(profilesRouter);
router.use(moderationRouter);

export default router;
