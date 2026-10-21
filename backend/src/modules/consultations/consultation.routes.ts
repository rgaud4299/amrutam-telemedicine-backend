import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  bookConsultationSchema,
  updateConsultationStatusSchema,
} from "./consultation.validation";
import * as consultationController from "./consultation.controller";

const consultationRouter = Router();

consultationRouter.use(authorize({ optional: false }));

consultationRouter.post(
  "/book",
  authorize({ roles: ["PATIENT"] }),
  validate(bookConsultationSchema),
  consultationController.bookConsultation,
);

consultationRouter.get("/my", consultationController.getMyConsultations);
consultationRouter.get("/:id", consultationController.getConsultationById);

consultationRouter.patch(
  "/:id/status",
  authorize({ roles: ["DOCTOR", "ADMIN"] }),
  validate(updateConsultationStatusSchema),
  consultationController.updateStatus,
);

consultationRouter.patch("/:id/cancel", consultationController.cancelConsultation);

export default consultationRouter;
