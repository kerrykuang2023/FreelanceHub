import { Router } from 'express';
import RatingController from '../controllers/rating.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, RatingController.createRating as any);
router.get('/', authMiddleware, RatingController.getRatings as any);
router.get('/:id', authMiddleware, RatingController.getRatingById as any);
router.post('/:id/reply', authMiddleware, RatingController.replyToRating as any);
router.put('/:id/hide', authMiddleware, RatingController.hideRating as any);
router.post('/:id/dispute', authMiddleware, RatingController.disputeRating as any);

export default router;
