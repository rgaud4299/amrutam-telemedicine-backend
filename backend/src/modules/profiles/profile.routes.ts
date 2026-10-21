import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { updateProfileSchema } from "./profile.validation";
import * as profileController from "./profile.controller";

const profileRouter = Router();

profileRouter.use(authorize({ optional: false }));

profileRouter.get("/", profileController.getProfile);
profileRouter.put("/", validate(updateProfileSchema), profileController.updateProfile);

export default profileRouter;
