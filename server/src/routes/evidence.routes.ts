import { Router } from 'express';
import EvidenceController from '../controllers/evidence.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, EvidenceController.uploadEvidence as any);
router.get('/ticket/:ticketId', authMiddleware, EvidenceController.getEvidenceByTicket as any);
router.get('/ticket/:ticketId/stats', authMiddleware, EvidenceController.getEvidenceStats as any);
router.get('/:id', authMiddleware, EvidenceController.getEvidenceById as any);
router.get('/:id/url', authMiddleware, EvidenceController.getEvidenceUrl as any);
router.delete('/:id', authMiddleware, EvidenceController.deleteEvidence as any);
router.post('/:id/verify', authMiddleware, EvidenceController.verifyEvidence as any);

export default router;
