import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import mediaRouter from "./media";
import walletRouter from "./wallet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mediaRouter);
router.use(walletRouter);

export default router;
