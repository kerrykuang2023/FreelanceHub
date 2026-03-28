import { Router } from 'express';
import InvoiceController from '../controllers/invoice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, InvoiceController.getInvoices as any);
router.get('/company', authMiddleware, InvoiceController.getCompanyInvoices as any);
router.get('/available-work-logs', authMiddleware, InvoiceController.getAvailableWorkLogs as any);
router.post('/calculate-tax', authMiddleware, InvoiceController.calculateTax as any);
router.get('/:id', authMiddleware, InvoiceController.getInvoiceById as any);
router.post('/', authMiddleware, InvoiceController.createInvoice as any);
router.put('/:id', authMiddleware, InvoiceController.updateInvoice as any);
router.delete('/:id', authMiddleware, InvoiceController.deleteInvoice as any);
router.post('/:id/submit', authMiddleware, InvoiceController.submitInvoice as any);
router.post('/:id/approve', authMiddleware, InvoiceController.approveInvoice as any);
router.post('/:id/reject', authMiddleware, InvoiceController.rejectInvoice as any);
router.post('/:id/mark-paid', authMiddleware, InvoiceController.markAsPaid as any);

export default router;
