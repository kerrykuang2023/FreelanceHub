import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, PaymentController.createPayment as any);
router.get('/', authMiddleware, PaymentController.getPayments as any);
router.get('/stats', authMiddleware, PaymentController.getPaymentStats as any);
router.get('/:id', authMiddleware, PaymentController.getPaymentById as any);
router.post('/:id/confirm', authMiddleware, PaymentController.confirmPayment as any);
router.post('/:id/voucher', authMiddleware, PaymentController.uploadVoucher as any);

export default router;
