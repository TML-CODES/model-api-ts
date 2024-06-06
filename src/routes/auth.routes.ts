import { Router } from "express";
import { usersController, authController } from "../controllers";

const authRouter = Router();

authRouter.post("/", authController.authenticate);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);

authRouter.post("/resetPassword", usersController.sendPasswordResetEmail);

export default authRouter;