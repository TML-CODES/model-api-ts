import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMid";

const router = Router();
router.use("/auth", authRouter);

router.use(isAuthenticated);

router.use("/", someRouter);
router.use("/users", userRouter);

export default router;