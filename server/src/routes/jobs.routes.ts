import { Router } from "express";
import JobsController from "../controllers/jobs.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware } from "../middlewares/auth.middleware";

export default class JobsRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get("/types", asyncWrapper(JobsController.getJobTypes));
    this.router.get("/my-projects", authMiddleware, asyncWrapper(JobsController.getMyProjects));
    this.router.get("/my-posted-jobs", authMiddleware, asyncWrapper(JobsController.getMyPostedJobs));
    this.router.get("/status/:status", asyncWrapper(JobsController.getJobsByStatus));
    this.router.get("/", asyncWrapper(JobsController.getJobs));
    this.router.post("/", authMiddleware, asyncWrapper(JobsController.createJob));
    this.router.get("/:id", asyncWrapper(JobsController.getJob));
    this.router.put("/:id", authMiddleware, asyncWrapper(JobsController.updateJob));
    this.router.delete("/:id", authMiddleware, asyncWrapper(JobsController.deleteJob));
    this.router.put("/:id/status", authMiddleware, asyncWrapper(JobsController.changeJobStatus));
  }
}
