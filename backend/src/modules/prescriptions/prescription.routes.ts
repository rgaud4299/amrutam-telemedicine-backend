import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createPrescriptionSchema } from "./prescription.validation";
import * as prescriptionController from "./prescription.controller";

const prescriptionRouter = Router();

prescriptionRouter.use(authorize({ optional: false }));

prescriptionRouter.post(
  "/",
  authorize({ roles: ["DOCTOR"] }),
  validate(createPrescriptionSchema),
  prescriptionController.createPrescription,
);

prescriptionRouter.get("/consultation/:consultationId", prescriptionController.getPrescriptionByConsultationId);
prescriptionRouter.get("/my", prescriptionController.getMyPrescriptions);

export default prescriptionRouter;
