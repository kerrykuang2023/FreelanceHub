import { Application, Request, Response, NextFunction } from "express";
import UsersRoutes from "./users.routes";
import JobsRoutes from "./jobs.routes";
import JobApplicationsRoutes from "./job-applications.routers";
import AuthRoutes from "./auth.routes";
import SkillCategoryRoutes from "./skill-category.routes";
import WorkLogRoutes from "./work-log.routes";
import AdminRoutes from "./admin.routes";
import MatchRoutes from "./match.routes";
import ContractRoutes from "./contract.routes";
import MessageRoutes from "./message.routes";
import RatingRoutes from "./rating.routes";
import ReportRoutes from "./report.routes";
import TicketRoutes from "./ticket.routes";
import PaymentRoutes from "./payment.routes";
import NotificationPreferenceRoutes from "./notification-preference.routes";
import MilestoneRoutes from "./milestone.routes";
import EvidenceRoutes from "./evidence.routes";
import ArbitrationRoutes from "./arbitration.routes";
import FreelancerProfileRoutes from "./freelancer-profile.routes";
import InvoiceRoutes from "./invoice.routes";
import NotificationRoutes from "./notification.routes";
import CreditRoutes from "./credit.routes";
import UserReportRoutes from "./user-report.routes";
import CompaniesRoutes from "./companies.routes";
import HROnboardingRoutes from "./hr-onboarding.routes";
import HRProfileRoutes from "./hr-profile.routes";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../errors/ApiError";
import { authMiddleware } from "../middlewares/auth.middleware";

export default class Routes {
  constructor(app: Application) {
    app.use("/api/v1/auth", new AuthRoutes().router);
    app.use("/api/v1/admin", new AdminRoutes().router);
    app.use("/api/v1/jobs", new JobsRoutes().router);
    app.use("/api/v1/skills", new SkillCategoryRoutes().router);
    app.use("/api/v1/users", authMiddleware, new UsersRoutes().router);
    app.use("/api/v1/job-applications", authMiddleware, new JobApplicationsRoutes().router);
    app.use("/api/v1/work-logs", authMiddleware, new WorkLogRoutes().router);
    app.use("/api/v1/match", MatchRoutes);
    app.use("/api/v1/contracts", authMiddleware, ContractRoutes);
    app.use("/api/v1/messages", authMiddleware, MessageRoutes);
    app.use("/api/v1/ratings", authMiddleware, RatingRoutes);
    app.use("/api/v1/reports", authMiddleware, ReportRoutes);
    app.use("/api/v1/tickets", authMiddleware, TicketRoutes);
    app.use("/api/v1/payments", authMiddleware, PaymentRoutes);
    app.use("/api/v1/notification-preferences", authMiddleware, NotificationPreferenceRoutes);
    app.use("/api/v1/milestones", authMiddleware, MilestoneRoutes);
    app.use("/api/v1/evidence", authMiddleware, EvidenceRoutes);
    app.use("/api/v1/arbitration", authMiddleware, ArbitrationRoutes);
    app.use("/api/v1/freelancer-profile", FreelancerProfileRoutes);
    app.use("/api/v1/invoices", authMiddleware, InvoiceRoutes);
    app.use("/api/v1/notifications", authMiddleware, NotificationRoutes);
    app.use("/api/v1/credits", authMiddleware, CreditRoutes);
    app.use("/api/v1/user-reports", authMiddleware, UserReportRoutes);
    app.use("/api/v1/companies", new CompaniesRoutes().router);
    app.use("/api/v1/hr/onboarding", authMiddleware, HROnboardingRoutes);
    app.use("/api/v1/hr/profile", authMiddleware, HRProfileRoutes);

    app.get("/", (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send(`⚡️[Server]: Server is running!`);
    });

    app.get("/health", (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send(`⚡️[Server]: Server is running!`);
    });

    app.use("*", (req: Request, res: Response, next: NextFunction) => {
      const error = new ApiError(
        StatusCodes.NOT_FOUND,
        `🔍[Server]: Route not found: ${req.originalUrl}`
      );
      next(error);
    });
  }
}
