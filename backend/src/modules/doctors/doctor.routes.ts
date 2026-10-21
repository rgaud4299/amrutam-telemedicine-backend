import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { updateDoctorProfileSchema } from "./doctor.validation";
import * as doctorController from "./doctor.controller";

const doctorRouter = Router();

doctorRouter.use(authorize({ optional: false }));

doctorRouter.get("/", doctorController.getDoctors);
doctorRouter.get("/:id", doctorController.getDoctorById);
doctorRouter.put(
  "/profile",
  authorize({ roles: ["DOCTOR"] }),
  validate(updateDoctorProfileSchema),
  doctorController.updateProfile,
);

export default doctorRouter;
