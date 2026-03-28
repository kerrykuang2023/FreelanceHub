import { Router } from "express";
import AdminController from "../controllers/admin.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export default class AdminRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.use(authMiddleware);
    this.router.use(requireRole("admin"));

    this.router.get("/users", asyncWrapper(AdminController.getAllUsers));
    this.router.put("/users/:id/status", asyncWrapper(AdminController.updateUserStatus));

    this.router.get("/dashboard/stats", asyncWrapper(AdminController.getDashboardStats));
    this.router.get("/companies", asyncWrapper(AdminController.getAllCompanies));
    this.router.get("/companies/:id", asyncWrapper(AdminController.getCompanyById));
    this.router.put("/companies/:id/verify", asyncWrapper(AdminController.verifyCompany));

    this.router.get("/work-logs", asyncWrapper(AdminController.getAllWorkLogs));

    this.router.get("/invoices", asyncWrapper(AdminController.getAllInvoices));

    this.router.get("/projects", asyncWrapper(AdminController.getAllProjects));

    this.router.get("/freelancers", asyncWrapper(AdminController.getAllFreelancers));

    this.router.get("/skills", asyncWrapper(AdminController.getSkillCategories));
    this.router.post("/skills", asyncWrapper(AdminController.createSkillCategory));
    this.router.put("/skills/:id", asyncWrapper(AdminController.updateSkillCategory));
    this.router.delete("/skills/:id", asyncWrapper(AdminController.deleteSkillCategory));
    this.router.post("/skills/sub-categories", asyncWrapper(AdminController.createSubCategory));

    this.router.get("/financial/summary", asyncWrapper(AdminController.getFinancialSummary));

    this.router.get("/config/types", asyncWrapper(AdminController.getConfigTypes));
    this.router.get("/configs", asyncWrapper(AdminController.getSystemConfigs));
    this.router.post("/configs", asyncWrapper(AdminController.createSystemConfig));
    this.router.put("/configs/:id", asyncWrapper(AdminController.updateSystemConfig));
    this.router.delete("/configs/:id", asyncWrapper(AdminController.deleteSystemConfig));
    this.router.post("/configs/initialize", asyncWrapper(AdminController.initializeDefaultConfigs));

    this.router.get("/role-approvals", asyncWrapper(AdminController.getRoleApprovals));
    this.router.get("/role-approvals/stats", asyncWrapper(AdminController.getApprovalStats));
    this.router.get("/role-approvals/:id", asyncWrapper(AdminController.getRoleApprovalById));
    this.router.put("/role-approvals/:id/approve", asyncWrapper(AdminController.approveRoleApplication));
    this.router.put("/role-approvals/:id/reject", asyncWrapper(AdminController.rejectRoleApplication));
  }
}
