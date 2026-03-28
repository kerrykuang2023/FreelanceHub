import { Router } from "express";
import WorkLogController from "../controllers/work-log.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware } from "../middlewares/auth.middleware";

export default class WorkLogRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // All routes require authentication
    this.router.use(authMiddleware);

    // Freelancer routes
    this.router.get("/available-projects", asyncWrapper(WorkLogController.getAvailableProjects));
    this.router.get("/", asyncWrapper(WorkLogController.getWorkLogs));
    this.router.get("/summary", asyncWrapper(WorkLogController.getWorkLogSummary));
    
    // Company/HR routes (for approving/rejecting) - MUST be before /:id
    this.router.get("/hr", asyncWrapper(WorkLogController.getHRWorkLogs));
    this.router.get("/company/pending", asyncWrapper(WorkLogController.getPendingWorkLogsForCompany));
    this.router.post("/batch/submit", asyncWrapper(WorkLogController.batchSubmitWorkLogs));
    this.router.post("/batch/confirm", asyncWrapper(WorkLogController.batchConfirmWorkLogs));
    
    // Routes with :id parameter - MUST be after static routes
    this.router.get("/:id", asyncWrapper(WorkLogController.getWorkLogById));
    this.router.post("/:id/submit", asyncWrapper(WorkLogController.submitWorkLog));
    this.router.post("/:id/withdraw", asyncWrapper(WorkLogController.withdrawWorkLog));
    this.router.post("/:id/confirm", asyncWrapper(WorkLogController.confirmWorkLog));
    this.router.post("/:id/reject", asyncWrapper(WorkLogController.rejectWorkLog));
    
    // CRUD routes
    this.router.post("/", asyncWrapper(WorkLogController.createWorkLog));
    this.router.put("/:id", asyncWrapper(WorkLogController.updateWorkLog));
    this.router.delete("/:id", asyncWrapper(WorkLogController.deleteWorkLog));
  }
}