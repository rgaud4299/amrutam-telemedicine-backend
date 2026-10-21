import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import * as analyticsController from "./analytics.controller";

const analyticsRouter = Router();

analyticsRouter.use(authorize({ optional: false, roles: ["ADMIN"] }));

analyticsRouter.get("/", analyticsController.getAdminAnalytics);

export default analyticsRouter;
