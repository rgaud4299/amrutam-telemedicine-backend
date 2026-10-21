import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { authorize } from "../../middlewares/auth.middleware";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);

authRouter.get("/me", authorize({ optional: false }), authController.getMe);
authRouter.post("/mfa/setup", authorize({ optional: false }), authController.setupMfa);
authRouter.post("/mfa/enable", authorize({ optional: false }), authController.enableMfa);

export default authRouter;
