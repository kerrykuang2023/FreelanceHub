import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import RatingService from '../services/rating.service';

class RatingController {
  public createRating = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = (req.user as any)?.user_type;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const rating = await RatingService.createRating(
        req.body,
        userId,
        userType === 'HR Recruiter' ? 'company' : 'freelancer'
      );

      res.status(201).json({ success: true, data: rating, message: 'Rating created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getRatings = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { reviewee_id, reviewer_id, project_id, page, pageSize, status } = req.query;

      const result = await RatingService.getRatings({
        reviewee_id: reviewee_id as string,
        reviewer_id: reviewer_id as string,
        project_id: project_id as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        status: status as string,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getRatingById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const rating = await RatingService.getRatingById(req.params.id);
      if (!rating) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rating not found' },
        });
        return;
      }
      res.json({ success: true, data: rating });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public replyToRating = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { content } = req.body;
      const rating = await RatingService.replyToRating(req.params.id, userId, content);

      res.json({ success: true, data: rating, message: 'Reply added successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REPLY_ERROR', message: error.message },
      });
    }
  };

  public hideRating = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const rating = await RatingService.hideRating(req.params.id);
      res.json({ success: true, data: rating, message: 'Rating hidden' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public disputeRating = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const rating = await RatingService.disputeRating(req.params.id);
      res.json({ success: true, data: rating, message: 'Rating disputed' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };
}

export default new RatingController();
