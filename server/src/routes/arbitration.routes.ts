import { Router } from 'express';
import ArbitrationController from '../controllers/arbitration.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, ArbitrationController.createArbitration as any);
router.get('/', authMiddleware, ArbitrationController.getArbitrations as any);
router.get('/:id', authMiddleware, ArbitrationController.getArbitrationById as any);
router.post('/:id/assign', authMiddleware, ArbitrationController.assignArbitrator as any);
router.post('/:id/defense', authMiddleware, ArbitrationController.submitDefense as any);
router.post('/:id/resolve', authMiddleware, ArbitrationController.resolveArbitration as any);
router.post('/:id/hearing', authMiddleware, ArbitrationController.scheduleHearing as any);
router.post('/:id/close', authMiddleware, ArbitrationController.closeArbitration as any);

export default router;
