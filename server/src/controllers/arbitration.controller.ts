import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import ArbitrationService from '../services/arbitration.service';

class ArbitrationController {
  public createArbitration = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const arbitration = await ArbitrationService.createArbitration(req.body, userId);
      res.status(201).json({ success: true, data: arbitration, message: 'Arbitration created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getArbitrations = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { status, page, pageSize } = req.query;

      const result = await ArbitrationService.getArbitrations({
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

  public getArbitrationById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const arbitration = await ArbitrationService.getArbitrationById(req.params.id);
      if (!arbitration) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Arbitration not found' },
        });
        return;
      }
      res.json({ success: true, data: arbitration });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public assignArbitrator = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { arbitratorId } = req.body;
      const arbitration = await ArbitrationService.assignArbitrator(req.params.id, arbitratorId);
      if (!arbitration) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Arbitration not found' },
        });
        return;
      }
      res.json({ success: true, data: arbitration, message: 'Arbitrator assigned' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ASSIGN_ERROR', message: error.message },
      });
    }
  };

  public submitDefense = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const arbitration = await ArbitrationService.submitDefense(req.params.id, userId, req.body);
      res.json({ success: true, data: arbitration, message: 'Defense submitted' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error.message },
      });
    }
  };

  public resolveArbitration = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const arbitration = await ArbitrationService.resolveArbitration(req.params.id, userId, req.body);
      res.json({ success: true, data: arbitration, message: 'Arbitration resolved' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'RESOLVE_ERROR', message: error.message },
      });
    }
  };

  public scheduleHearing = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { hearingDate, notes } = req.body;
      const arbitration = await ArbitrationService.scheduleHearing(req.params.id, new Date(hearingDate), notes);
      if (!arbitration) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Arbitration not found' },
        });
        return;
      }
      res.json({ success: true, data: arbitration, message: 'Hearing scheduled' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SCHEDULE_ERROR', message: error.message },
      });
    }
  };

  public closeArbitration = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const arbitration = await ArbitrationService.closeArbitration(req.params.id);
      if (!arbitration) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Arbitration not found' },
        });
        return;
      }
      res.json({ success: true, data: arbitration, message: 'Arbitration closed' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CLOSE_ERROR', message: error.message },
      });
    }
  };
}

export default new ArbitrationController();
