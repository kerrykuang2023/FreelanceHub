import { Request, Response } from 'express';
import MatchScoreService from '../services/match-score.service';
import SkillMatchService from '../services/skill-match.service';
import LocationMatchService from '../services/location-match.service';
import RateMatchService from '../services/rate-match.service';
import AvailabilityMatchService from '../services/availability-match.service';

class MatchController {
  public getMatchScore = async (req: Request, res: Response): Promise<void> => {
    try {
      const { freelancerId, projectId } = req.query;

      if (!freelancerId || !projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'freelancerId and projectId are required',
          },
        });
        return;
      }

      const matchScore = await MatchScoreService.calculateMatchScore({
        freelancerId: freelancerId as string,
        projectId: projectId as string,
      });

      res.json({
        success: true,
        data: matchScore,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message || 'Failed to calculate match score',
        },
      });
    }
  };

  public getProjectRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const freelancerId = (req.user as any)?.id;
      const { limit, minScore, status } = req.query;

      if (!freelancerId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const recommendations = await MatchScoreService.getProjectRecommendations(
        freelancerId,
        {
          limit: limit ? parseInt(limit as string) : 20,
          minScore: minScore ? parseInt(minScore as string) : 0,
          status: status as string,
        }
      );

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error.message || 'Failed to get project recommendations',
        },
      });
    }
  };

  public getFreelancerRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { limit, minScore } = req.query;

      const recommendations = await MatchScoreService.getFreelancerRecommendations(
        projectId,
        {
          limit: limit ? parseInt(limit as string) : 20,
          minScore: minScore ? parseInt(minScore as string) : 0,
        }
      );

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error.message || 'Failed to get freelancer recommendations',
        },
      });
    }
  };

  public getSkillMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { freelancerId, projectId } = req.query;

      if (!freelancerId || !projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'freelancerId and projectId are required',
          },
        });
        return;
      }

      const result = await SkillMatchService.calculateSkillMatchForFreelancer(
        freelancerId as string,
        projectId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message || 'Failed to calculate skill match',
        },
      });
    }
  };

  public getLocationMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { freelancerId, projectId } = req.query;

      if (!freelancerId || !projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'freelancerId and projectId are required',
          },
        });
        return;
      }

      const result = await LocationMatchService.calculateLocationMatchForFreelancer(
        freelancerId as string,
        projectId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message || 'Failed to calculate location match',
        },
      });
    }
  };

  public getRateMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { freelancerId, projectId } = req.query;

      if (!freelancerId || !projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'freelancerId and projectId are required',
          },
        });
        return;
      }

      const result = await RateMatchService.calculateRateMatchForFreelancer(
        freelancerId as string,
        projectId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message || 'Failed to calculate rate match',
        },
      });
    }
  };

  public getAvailabilityMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { freelancerId, projectId } = req.query;

      if (!freelancerId || !projectId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'freelancerId and projectId are required',
          },
        });
        return;
      }

      const result = await AvailabilityMatchService.calculateAvailabilityMatchForFreelancer(
        freelancerId as string,
        projectId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message || 'Failed to calculate availability match',
        },
      });
    }
  };
}

export default new MatchController();
