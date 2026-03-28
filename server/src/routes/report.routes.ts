import { Router } from 'express';
import ReportController from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/income', authMiddleware, ReportController.getIncomeReport as any);
router.get('/income/projects', authMiddleware, ReportController.getProjectIncomeBreakdown as any);
router.get('/expense', authMiddleware, ReportController.getExpenseReport as any);
router.get('/profit', authMiddleware, ReportController.getProfitReport as any);
router.get('/worklog-stats', authMiddleware, ReportController.getWorkLogStats as any);
router.get('/export', authMiddleware, ReportController.exportReport as any);

export default router;
