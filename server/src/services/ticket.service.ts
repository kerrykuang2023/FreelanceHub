import Ticket, { ITicket, TicketStatus, TicketPriority, TicketCategory } from '../models/ticket/ticket.model';
import UserAccount from '../models/user/user-account.model';

export interface CreateTicketDTO {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  related_project_id?: string;
  related_worklog_id?: string;
  related_invoice_id?: string;
}

export interface AddMessageDTO {
  content: string;
  attachments?: string[];
}

class TicketService {
  private static INSTANCE: TicketService;

  public static getInstance(): TicketService {
    if (!TicketService.INSTANCE) {
      TicketService.INSTANCE = new TicketService();
    }
    return TicketService.INSTANCE;
  }

  public async createTicket(data: CreateTicketDTO, creatorId: string): Promise<ITicket> {
    const user = await UserAccount.findById(creatorId);
    if (!user) {
      throw new Error('User not found');
    }

    const ticket = await Ticket.create({
      ...data,
      creator_id: creatorId,
      status: 'pending',
      messages: [
        {
          sender_id: creatorId,
          sender_name: user.email,
          content: data.description,
          attachments: [],
          created_at: new Date(),
        },
      ],
    });

    return ticket;
  }

  public async getTickets(options: {
    page?: number;
    pageSize?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    creator_id?: string;
    assignee_id?: string;
  } = {}): Promise<{ items: ITicket[]; total: number }> {
    const { page = 1, pageSize = 20, status, priority, category, creator_id, assignee_id } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (creator_id) filter.creator_id = creator_id;
    if (assignee_id) filter.assignee_id = assignee_id;

    const [items, total] = await Promise.all([
      Ticket.find(filter)
        .populate('creator_id', 'email')
        .populate('assignee_id', 'email')
        .populate('related_project_id', 'project_title')
        .sort({ priority: -1, created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      Ticket.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getTicketById(id: string): Promise<ITicket | null> {
    return Ticket.findById(id)
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email')
      .populate('related_project_id', 'project_title')
      .populate('related_worklog_id')
      .populate('related_invoice_id')
      .populate('messages.sender_id', 'email user_image');
  }

  public async addMessage(id: string, data: AddMessageDTO, senderId: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const user = await UserAccount.findById(senderId);
    if (!user) {
      throw new Error('User not found');
    }

    ticket.messages.push({
      sender_id: senderId as any,
      sender_name: user.email,
      content: data.content,
      attachments: data.attachments || [],
      created_at: new Date(),
    });

    if (ticket.status === 'pending') {
      ticket.status = 'processing';
    }

    await ticket.save();
    return ticket;
  }

  public async assignTicket(id: string, assigneeId: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.assignee_id = assigneeId as any;
    ticket.status = 'processing';

    await ticket.save();
    return ticket;
  }

  public async resolveTicket(id: string, resolution: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = 'resolved';
    ticket.resolution = resolution;
    ticket.resolved_at = new Date();

    await ticket.save();
    return ticket;
  }

  public async closeTicket(id: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = 'closed';
    ticket.closed_at = new Date();

    await ticket.save();
    return ticket;
  }

  public async reopenTicket(id: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = 'processing';
    ticket.resolution = undefined;
    ticket.resolved_at = undefined;
    ticket.closed_at = undefined;

    await ticket.save();
    return ticket;
  }

  public async updatePriority(id: string, priority: TicketPriority): Promise<ITicket> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.priority = priority;
    await ticket.save();
    return ticket;
  }

  public async getTicketStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    closed: number;
    byPriority: { [key: string]: number };
    byCategory: { [key: string]: number };
  }> {
    const [total, pending, processing, resolved, closed] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: 'processing' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
    ]);

    const priorityStats = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const byPriority: { [key: string]: number } = {};
    for (const stat of priorityStats) {
      byPriority[stat._id] = stat.count;
    }

    const byCategory: { [key: string]: number } = {};
    for (const stat of categoryStats) {
      byCategory[stat._id] = stat.count;
    }

    return { total, pending, processing, resolved, closed, byPriority, byCategory };
  }
}

export default TicketService.getInstance();
