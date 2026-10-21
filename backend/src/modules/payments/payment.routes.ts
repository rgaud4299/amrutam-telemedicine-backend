import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createPaymentSchema } from "./payment.validation";
import * as paymentController from "./payment.controller";

const paymentRouter = Router();

paymentRouter.use(authorize({ optional: false }));

paymentRouter.post(
  "/",
  authorize({ roles: ["PATIENT"] }),
  validate(createPaymentSchema),
  paymentController.processPayment,
);

paymentRouter.get("/my", paymentController.getMyPayments);
paymentRouter.get("/:id", paymentController.getPaymentById);

export default paymentRouter;
