import { Request, Response } from 'express';
import ContractService from '../services/contract.service';

class ContractController {
  public createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const template = await ContractService.createTemplate(req.body, userId);
      res.status(201).json({ success: true, data: template, message: 'Contract template created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, pageSize } = req.query;
      const result = await ContractService.getTemplates({
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

  public getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await ContractService.getTemplateById(req.params.id);
      if (!template) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
        });
        return;
      }
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await ContractService.updateTemplate(req.params.id, req.body);
      if (!template) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
        });
        return;
      }
      res.json({ success: true, data: template, message: 'Template updated successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await ContractService.deleteTemplate(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Template not found' },
        });
        return;
      }
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      });
    }
  };

  public getDefaultTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await ContractService.getDefaultTemplate();
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public createContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const contract = await ContractService.createContract(req.body, userId);
      res.status(201).json({ success: true, data: contract, message: 'Contract created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getContracts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, pageSize, status, freelancer_id, company_id, project_id } = req.query;
      const result = await ContractService.getContracts({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        status: status as any,
        freelancer_id: freelancer_id as string,
        company_id: company_id as string,
        project_id: project_id as string,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getContractById = async (req: Request, res: Response): Promise<void> => {
    try {
      const contract = await ContractService.getContractById(req.params.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }
      res.json({ success: true, data: contract });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public updateContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contract = await ContractService.updateContract(req.params.id, req.body);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }
      res.json({ success: true, data: contract, message: 'Contract updated successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public submitForSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const contract = await ContractService.submitForSignature(req.params.id);
      res.json({ success: true, data: contract, message: 'Contract submitted for signature' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error.message },
      });
    }
  };

  public signContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const contract = await ContractService.signContract(
        { contract_id: req.params.id, ...req.body },
        userId
      );
      res.json({ success: true, data: contract, message: 'Contract signed successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SIGN_ERROR', message: error.message },
      });
    }
  };

  public terminateContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason } = req.body;
      const contract = await ContractService.terminateContract(req.params.id, reason);
      res.json({ success: true, data: contract, message: 'Contract terminated' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'TERMINATE_ERROR', message: error.message },
      });
    }
  };
}

export default new ContractController();
