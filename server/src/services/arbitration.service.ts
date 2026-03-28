import Arbitration, { IArbitration } from '../models/arbitration/arbitration.model';
import Ticket from '../models/ticket/ticket.model';
import MessageService from './message.service';

export interface CreateArbitrationDTO {
  ticket_id: string;
  applicant_claim: string;
  evidence_ids?: string[];
}

export interface SubmitDefenseDTO {
  defense: string;
  evidence_ids?: string[];
}

export interface ResolveArbitrationDTO {
  decision: string;
  resolution_type: 'favor_applicant' | 'favor_respondent' | 'compromise' | 'dismissed';
  resolution_details?: string;
}

class ArbitrationService {
  private static INSTANCE: ArbitrationService;

  public static getInstance(): ArbitrationService {
    if (!ArbitrationService.INSTANCE) {
      ArbitrationService.INSTANCE = new ArbitrationService();
    }
    return ArbitrationService.INSTANCE;
  }

  public async createArbitration(
    data: CreateArbitrationDTO,
    applicantId: string
  ): Promise<IArbitration> {
    const ticket = await Ticket.findById(data.ticket_id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status !== 'processing') {
      throw new Error('Ticket must be in processing status to request arbitration');
    }

    const existingArbitration = await Arbitration.findOne({ ticket_id: data.ticket_id });
    if (existingArbitration) {
      throw new Error('Arbitration already exists for this ticket');
    }

    const respondentId = ticket.creator_id.toString() === applicantId
      ? ticket.assignee_id
      : ticket.creator_id;

    const arbitration = await Arbitration.create({
      ticket_id: data.ticket_id,
      applicant_id: applicantId,
      respondent_id: respondentId,
      applicant_claim: data.applicant_claim,
      evidence_ids: data.evidence_ids || [],
      status: 'pending',
    });

    ticket.status = 'arbitration';
    await ticket.save();

    if (respondentId) {
      await MessageService.createSystemMessage(
        respondentId.toString(),
        '仲裁申请通知',
        `您收到一个仲裁申请，请及时提交答辩。`,
        'other',
        `/arbitration/${arbitration._id}`,
        arbitration._id.toString()
      );
    }

    return arbitration;
  }

  public async getArbitrations(options: {
    applicant_id?: string;
    respondent_id?: string;
    arbitrator_id?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: IArbitration[]; total: number }> {
    const { applicant_id, respondent_id, arbitrator_id, status, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (applicant_id) filter.applicant_id = applicant_id;
    if (respondent_id) filter.respondent_id = respondent_id;
    if (arbitrator_id) filter.arbitrator_id = arbitrator_id;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Arbitration.find(filter)
        .populate('ticket_id')
        .populate('applicant_id', 'user_name user_image')
        .populate('respondent_id', 'user_name user_image')
        .populate('arbitrator_id', 'user_name user_image')
        .populate('evidence_ids')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      Arbitration.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getArbitrationById(id: string): Promise<IArbitration | null> {
    return Arbitration.findById(id)
      .populate('ticket_id')
      .populate('applicant_id', 'user_name user_image email')
      .populate('respondent_id', 'user_name user_image email')
      .populate('arbitrator_id', 'user_name user_image email')
      .populate('evidence_ids');
  }

  public async assignArbitrator(
    id: string,
    arbitratorId: string
  ): Promise<IArbitration | null> {
    const arbitration = await Arbitration.findByIdAndUpdate(
      id,
      {
        arbitrator_id: arbitratorId,
        status: 'in_review',
      },
      { new: true }
    );

    if (arbitration) {
      await MessageService.createSystemMessage(
        arbitration.applicant_id.toString(),
        '仲裁已分配',
        '您的仲裁申请已分配仲裁员，正在审理中。',
        'other',
        `/arbitration/${arbitration._id}`,
        arbitration._id.toString()
      );

      await MessageService.createSystemMessage(
        arbitration.respondent_id.toString(),
        '仲裁已分配',
        '仲裁已分配仲裁员，正在审理中。',
        'other',
        `/arbitration/${arbitration._id}`,
        arbitration._id.toString()
      );
    }

    return arbitration;
  }

  public async submitDefense(
    id: string,
    respondentId: string,
    data: SubmitDefenseDTO
  ): Promise<IArbitration | null> {
    const arbitration = await Arbitration.findOne({ _id: id, respondent_id: respondentId });
    if (!arbitration) {
      throw new Error('Arbitration not found or not authorized');
    }

    arbitration.respondent_defense = data.defense;
    if (data.evidence_ids) {
      arbitration.evidence_ids = [
        ...arbitration.evidence_ids.map((e) => e.toString()),
        ...data.evidence_ids,
      ] as any;
    }

    await arbitration.save();

    await MessageService.createSystemMessage(
      arbitration.applicant_id.toString(),
      '答辩已提交',
      '被申请人已提交答辩，请查看。',
      'other',
      `/arbitration/${arbitration._id}`,
      arbitration._id.toString()
    );

    return arbitration;
  }

  public async resolveArbitration(
    id: string,
    arbitratorId: string,
    data: ResolveArbitrationDTO
  ): Promise<IArbitration | null> {
    const arbitration = await Arbitration.findOne({ _id: id, arbitrator_id: arbitratorId });
    if (!arbitration) {
      throw new Error('Arbitration not found or not authorized');
    }

    arbitration.decision = data.decision;
    arbitration.resolution_type = data.resolution_type;
    arbitration.resolution_details = data.resolution_details;
    arbitration.status = 'resolved';
    arbitration.resolved_at = new Date();

    await arbitration.save();

    const ticket = await Ticket.findById(arbitration.ticket_id);
    if (ticket) {
      ticket.status = 'resolved';
      ticket.resolution = `仲裁结果: ${data.resolution_type}`;
      ticket.resolved_at = new Date();
      await ticket.save();
    }

    await MessageService.createSystemMessage(
      arbitration.applicant_id.toString(),
      '仲裁结果通知',
      `仲裁已作出裁决，结果: ${this.getResolutionTypeLabel(data.resolution_type)}`,
      'other',
      `/arbitration/${arbitration._id}`,
      arbitration._id.toString()
    );

    await MessageService.createSystemMessage(
      arbitration.respondent_id.toString(),
      '仲裁结果通知',
      `仲裁已作出裁决，结果: ${this.getResolutionTypeLabel(data.resolution_type)}`,
      'other',
      `/arbitration/${arbitration._id}`,
      arbitration._id.toString()
    );

    return arbitration;
  }

  public async closeArbitration(id: string): Promise<IArbitration | null> {
    const arbitration = await Arbitration.findByIdAndUpdate(
      id,
      {
        status: 'closed',
        closed_at: new Date(),
      },
      { new: true }
    );

    return arbitration;
  }

  public async scheduleHearing(
    id: string,
    hearingDate: Date,
    notes?: string
  ): Promise<IArbitration | null> {
    const arbitration = await Arbitration.findByIdAndUpdate(
      id,
      {
        hearing_date: hearingDate,
        hearing_notes: notes,
      },
      { new: true }
    );

    if (arbitration) {
      await MessageService.createSystemMessage(
        arbitration.applicant_id.toString(),
        '听证会通知',
        `听证会已安排在 ${hearingDate.toLocaleString()}，请准时参加。`,
        'other',
        `/arbitration/${arbitration._id}`,
        arbitration._id.toString()
      );

      await MessageService.createSystemMessage(
        arbitration.respondent_id.toString(),
        '听证会通知',
        `听证会已安排在 ${hearingDate.toLocaleString()}，请准时参加。`,
        'other',
        `/arbitration/${arbitration._id}`,
        arbitration._id.toString()
      );
    }

    return arbitration;
  }

  private getResolutionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      favor_applicant: '支持申请人',
      favor_respondent: '支持被申请人',
      compromise: '调解解决',
      dismissed: '驳回申请',
    };
    return labels[type] || type;
  }
}

export default ArbitrationService.getInstance();
