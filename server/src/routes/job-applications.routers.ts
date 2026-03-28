import { Router } from "express";
import JobApplicationsController from "../controllers/job-applications.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware } from "../middlewares/auth.middleware";

export default class JobApplicationsRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get(
      "/my-applications",
      authMiddleware,
      asyncWrapper(JobApplicationsController.getUserApplications)
    );
    this.router.get(
      "/received",
      authMiddleware,
      asyncWrapper(JobApplicationsController.getApplicationsForMyJobs)
    );
    this.router.post(
      "/jobs/:id/apply",
      authMiddleware,
      asyncWrapper(JobApplicationsController.applyForJob)
    );
    this.router.post(
      "/projects/:id/apply",
      authMiddleware,
      asyncWrapper(JobApplicationsController.applyForProject)
    );
    this.router.get(
      "/jobs/:id/applications",
      authMiddleware,
      asyncWrapper(JobApplicationsController.getJobApplications)
    );
    this.router.get(
      "/:id",
      authMiddleware,
      asyncWrapper(JobApplicationsController.getApplicationById)
    );
    this.router.patch(
      "/:id/status",
      authMiddleware,
      asyncWrapper(JobApplicationsController.updateJobApplication)
    );
    this.router.post(
      "/:id/withdraw",
      authMiddleware,
      asyncWrapper(JobApplicationsController.withdrawApplication)
    );
  }
}
