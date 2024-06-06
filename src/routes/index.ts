import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

const router = Router();
router.use("/auth", authRouter);

router.use(isAuthenticated);

router.use("/users", userRouter);

export default router;