import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import TicketService from '../services/ticket.service';

class TicketController {
  public createTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const ticket = await TicketService.createTicket(req.body, userId);
      res.status(201).json({ success: true, data: ticket, message: 'Ticket created successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getTickets = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = (req.user as any)?.user_type;
      const { page, pageSize, status, priority, category, creator_id, assignee_id } = req.query;

      const options: any = {
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        status: status as any,
        priority: priority as any,
        category: category as any,
      };

      if (userType !== 'Administrator') {
        options.creator_id = userId;
      } else {
        if (creator_id) options.creator_id = creator_id as string;
        if (assignee_id) options.assignee_id = assignee_id as string;
      }

      const result = await TicketService.getTickets(options);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getTicketById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const ticket = await TicketService.getTicketById(req.params.id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Ticket not found' },
        });
        return;
      }
      res.json({ success: true, data: ticket });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public addMessage = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const ticket = await TicketService.addMessage(req.params.id, req.body, userId);
      res.json({ success: true, data: ticket, message: 'Message added' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'MESSAGE_ERROR', message: error.message },
      });
    }
  };

  public assignTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { assigneeId } = req.body;
      const ticket = await TicketService.assignTicket(req.params.id, assigneeId);
      res.json({ success: true, data: ticket, message: 'Ticket assigned' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ASSIGN_ERROR', message: error.message },
      });
    }
  };

  public resolveTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { resolution } = req.body;
      const ticket = await TicketService.resolveTicket(req.params.id, resolution);
      res.json({ success: true, data: ticket, message: 'Ticket resolved' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'RESOLVE_ERROR', message: error.message },
      });
    }
  };

  public closeTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const ticket = await TicketService.closeTicket(req.params.id);
      res.json({ success: true, data: ticket, message: 'Ticket closed' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CLOSE_ERROR', message: error.message },
      });
    }
  };

  public reopenTicket = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const ticket = await TicketService.reopenTicket(req.params.id);
      res.json({ success: true, data: ticket, message: 'Ticket reopened' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REOPEN_ERROR', message: error.message },
      });
    }
  };

  public updatePriority = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { priority } = req.body;
      const ticket = await TicketService.updatePriority(req.params.id, priority);
      res.json({ success: true, data: ticket, message: 'Priority updated' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  };

  public getStats = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const stats = await TicketService.getTicketStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };
}

export default new TicketController();
