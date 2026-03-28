import { Router } from 'express';
import JobApplicationsController from '../controllers/job-applications.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/jobs/:id/apply', authMiddleware, JobApplicationsController.applyForJob as any);
router.post('/projects/:id/apply', authMiddleware, JobApplicationsController.applyForProject as any);
router.get('/received', authMiddleware, JobApplicationsController.getApplicationsForMyJobs as any);
router.get('/my-applications', authMiddleware, JobApplicationsController.getUserApplications as any);
router.get('/jobs/:id/applications', authMiddleware, JobApplicationsController.getJobApplications as any);
router.patch('/:id/status', authMiddleware, JobApplicationsController.updateJobApplication as any);
router.post('/:id/withdraw', authMiddleware, JobApplicationsController.withdrawApplication as any);
router.get('/:id', authMiddleware, JobApplicationsController.getApplicationById as any);

export default router;
