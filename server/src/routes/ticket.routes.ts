import { Router } from 'express';
import TicketController from '../controllers/ticket.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, TicketController.createTicket as any);
router.get('/', authMiddleware, TicketController.getTickets as any);
router.get('/stats', authMiddleware, TicketController.getStats as any);
router.get('/:id', authMiddleware, TicketController.getTicketById as any);
router.post('/:id/messages', authMiddleware, TicketController.addMessage as any);
router.put('/:id/assign', authMiddleware, TicketController.assignTicket as any);
router.put('/:id/resolve', authMiddleware, TicketController.resolveTicket as any);
router.put('/:id/close', authMiddleware, TicketController.closeTicket as any);
router.put('/:id/reopen', authMiddleware, TicketController.reopenTicket as any);
router.put('/:id/priority', authMiddleware, TicketController.updatePriority as any);

export default router;
