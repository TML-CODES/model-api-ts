import { Router } from "express";
import { UsersController, AuthController } from "../controllers";

const authRouter = Router();

authRouter.post("/", AuthController.authenticate);
authRouter.post("/refresh", AuthController.refreshToken);
authRouter.post("/logout", AuthController.logout);

authRouter.post("/resetPassword", UsersController.sendPasswordResetEmail);

export default authRouter;