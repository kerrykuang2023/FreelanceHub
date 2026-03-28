import { Router } from "express";
import UserReportController from "../controllers/user-report.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, asyncWrapper(UserReportController.createReport));
router.get("/my", authMiddleware, asyncWrapper(UserReportController.getMyReports));
router.get("/my/:id", authMiddleware, asyncWrapper(UserReportController.getReportById));
router.delete("/my/:id", authMiddleware, asyncWrapper(UserReportController.cancelReport));

router.get("/all", authMiddleware, requireRole("admin"), asyncWrapper(UserReportController.getAllReports));
router.get("/stats", authMiddleware, requireRole("admin"), asyncWrapper(UserReportController.getReportStats));
router.put("/:id/investigate", authMiddleware, requireRole("admin"), asyncWrapper(UserReportController.startInvestigation));
router.put("/:id/verify", authMiddleware, requireRole("admin"), asyncWrapper(UserReportController.verifyReport));
router.put("/:id/dismiss", authMiddleware, requireRole("admin"), asyncWrapper(UserReportController.dismissReport));

export default router;
