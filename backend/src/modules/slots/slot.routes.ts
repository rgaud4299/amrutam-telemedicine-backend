import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createSlotSchema, bulkCreateSlotSchema } from "./slot.validation";
import * as slotController from "./slot.controller";

const slotRouter = Router();

slotRouter.use(authorize({ optional: false }));

slotRouter.get("/doctor/:doctorId", slotController.getDoctorSlots);

slotRouter.post(
  "/",
  authorize({ roles: ["DOCTOR"] }),
  validate(createSlotSchema),
  slotController.createSlot,
);

slotRouter.post(
  "/bulk",
  authorize({ roles: ["DOCTOR"] }),
  validate(bulkCreateSlotSchema),
  slotController.createBulkSlots,
);

slotRouter.delete(
  "/:slotId",
  authorize({ roles: ["DOCTOR"] }),
  slotController.deleteSlot,
);

export default slotRouter;
