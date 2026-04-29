import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import authRouter from "./auth";
import clientRouter from "./client";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/client", clientRouter);
router.use(leadsRouter);

export default router;
