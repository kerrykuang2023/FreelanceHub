import { Router } from 'express';
import MatchController from '../controllers/match.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/score', authMiddleware, MatchController.getMatchScore);

router.get('/recommendations/projects', authMiddleware, MatchController.getProjectRecommendations);

router.get('/recommendations/freelancers/:projectId', authMiddleware, MatchController.getFreelancerRecommendations);

router.get('/skill', authMiddleware, MatchController.getSkillMatch);

router.get('/location', authMiddleware, MatchController.getLocationMatch);

router.get('/rate', authMiddleware, MatchController.getRateMatch);

router.get('/availability', authMiddleware, MatchController.getAvailabilityMatch);

export default router;
