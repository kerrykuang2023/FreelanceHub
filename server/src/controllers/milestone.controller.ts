import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import MilestoneService from '../services/milestone.service';

class MilestoneController {
  public createMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const milestone = await MilestoneService.createMilestone(req.body);
      res.status(201).json({ success: true, data: milestone, message: 'Milestone created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getMilestones = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { project_id, freelancer_id, company_id, status, page, pageSize } = req.query;

      const result = await MilestoneService.getMilestones({
        project_id: project_id as string,
        freelancer_id: freelancer_id as string,
        company_id: company_id as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getMilestoneById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const milestone = await MilestoneService.getMilestoneById(req.params.id);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public updateMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const milestone = await MilestoneService.updateMilestone(req.params.id, req.body);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone, message: 'Milestone updated successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public deleteMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const deleted = await MilestoneService.deleteMilestone(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, message: 'Milestone deleted successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      });
    }
  };

  public startMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const milestone = await MilestoneService.startMilestone(req.params.id);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone, message: 'Milestone started' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'START_ERROR', message: error.message },
      });
    }
  };

  public submitMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { deliverables } = req.body;
      const milestone = await MilestoneService.submitMilestone(req.params.id, deliverables);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone, message: 'Milestone submitted for review' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error.message },
      });
    }
  };

  public approveMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { comment } = req.body;
      const milestone = await MilestoneService.approveMilestone(req.params.id, userId, comment);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone, message: 'Milestone approved' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'APPROVE_ERROR', message: error.message },
      });
    }
  };

  public rejectMilestone = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required' },
        });
        return;
      }

      const milestone = await MilestoneService.rejectMilestone(req.params.id, userId, reason);
      if (!milestone) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Milestone not found' },
        });
        return;
      }
      res.json({ success: true, data: milestone, message: 'Milestone rejected' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REJECT_ERROR', message: error.message },
      });
    }
  };

  public getProjectProgress = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const progress = await MilestoneService.getProjectProgress(projectId);
      res.json({ success: true, data: progress });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };
}

export default new MilestoneController();
