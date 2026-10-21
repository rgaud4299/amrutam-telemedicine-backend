import { Router } from "express";
import { authorize } from "../../middlewares/auth.middleware";
import * as auditController from "./audit.controller";

const auditRouter = Router();

auditRouter.use(authorize({ optional: false, roles: ["ADMIN"] }));

auditRouter.get("/", auditController.getAuditLogs);

export default auditRouter;
