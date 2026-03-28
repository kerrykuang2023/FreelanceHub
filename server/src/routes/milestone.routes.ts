import { Router } from 'express';
import MilestoneController from '../controllers/milestone.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, MilestoneController.createMilestone as any);
router.get('/', authMiddleware, MilestoneController.getMilestones as any);
router.get('/:id', authMiddleware, MilestoneController.getMilestoneById as any);
router.put('/:id', authMiddleware, MilestoneController.updateMilestone as any);
router.delete('/:id', authMiddleware, MilestoneController.deleteMilestone as any);
router.post('/:id/start', authMiddleware, MilestoneController.startMilestone as any);
router.post('/:id/submit', authMiddleware, MilestoneController.submitMilestone as any);
router.post('/:id/approve', authMiddleware, MilestoneController.approveMilestone as any);
router.post('/:id/reject', authMiddleware, MilestoneController.rejectMilestone as any);
router.get('/project/:projectId/progress', authMiddleware, MilestoneController.getProjectProgress as any);

export default router;
