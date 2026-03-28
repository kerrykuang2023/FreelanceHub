import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import EvidenceService from '../services/evidence.service';

class EvidenceController {
  public uploadEvidence = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const evidence = await EvidenceService.uploadEvidence(req.body, userId);
      res.status(201).json({ success: true, data: evidence, message: 'Evidence uploaded successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: error.message },
      });
    }
  };

  public getEvidenceByTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const evidences = await EvidenceService.getEvidenceByTicket(ticketId);
      res.json({ success: true, data: evidences });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getEvidenceById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const evidence = await EvidenceService.getEvidenceById(req.params.id);
      if (!evidence) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Evidence not found' },
        });
        return;
      }
      res.json({ success: true, data: evidence });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public deleteEvidence = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const deleted = await EvidenceService.deleteEvidence(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Evidence not found or not authorized' },
        });
        return;
      }
      res.json({ success: true, message: 'Evidence deleted successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      });
    }
  };

  public verifyEvidence = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const evidence = await EvidenceService.verifyEvidence(req.params.id, userId);
      if (!evidence) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Evidence not found' },
        });
        return;
      }
      res.json({ success: true, data: evidence, message: 'Evidence verified' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'VERIFY_ERROR', message: error.message },
      });
    }
  };

  public getEvidenceUrl = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const url = await EvidenceService.getEvidenceUrl(req.params.id);
      if (!url) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Evidence not found' },
        });
        return;
      }
      res.json({ success: true, data: { url } });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getEvidenceStats = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const stats = await EvidenceService.getEvidenceStats(ticketId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };
}

export default new EvidenceController();
