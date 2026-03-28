import MilestoneDeliverable from '../models/freelancer/milestone_deliverable.model';
import ProjectRequirement from '../models/freelancer/project_requirement.model';
import MessageService from './message.service';

export interface CreateMilestoneDTO {
  project_requirement_id: string;
  freelancer_id: string;
  company_id: string;
  milestone_name: string;
  description: string;
  planned_start_date: Date;
  planned_end_date: Date;
  milestone_amount?: number;
  currency?: string;
}

export interface UpdateMilestoneDTO {
  milestone_name?: string;
  description?: string;
  planned_start_date?: Date;
  planned_end_date?: Date;
  status?: string;
  completion_percentage?: number;
  notes?: string;
  milestone_amount?: number;
  currency?: string;
}

export interface DeliverableDTO {
  deliverable_name: string;
  deliverable_description: string;
  deliverable_url?: string;
}

class MilestoneService {
  private static INSTANCE: MilestoneService;

  public static getInstance(): MilestoneService {
    if (!MilestoneService.INSTANCE) {
      MilestoneService.INSTANCE = new MilestoneService();
    }
    return MilestoneService.INSTANCE;
  }

  public async createMilestone(data: CreateMilestoneDTO): Promise<any> {
    const count = await MilestoneDeliverable.countDocuments({
      project_requirement_id: data.project_requirement_id,
    });

    const milestone = await MilestoneDeliverable.create({
      ...data,
      milestone_number: count + 1,
      due_date: data.planned_end_date,
      status: 'planned',
      completion_percentage: 1,
      billing_info: {
        milestone_amount: data.milestone_amount || 1,
        currency: data.currency || 'CNY',
        is_invoiced: false,
      },
    });

    return milestone;
  }

  public async getMilestones(options: {
    project_id?: string;
    freelancer_id?: string;
    company_id?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: any[]; total: number }> {
    const { project_id, freelancer_id, company_id, status, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (project_id) filter.project_requirement_id = project_id;
    if (freelancer_id) filter.freelancer_id = freelancer_id;
    if (company_id) filter.company_id = company_id;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      MilestoneDeliverable.find(filter)
        .populate('project_requirement_id', 'project_title')
        .populate('freelancer_id', 'display_name')
        .populate('company_id', 'company_name')
        .sort({ milestone_number: 1 })
        .skip(skip)
        .limit(pageSize),
      MilestoneDeliverable.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getMilestoneById(id: string): Promise<any | null> {
    return MilestoneDeliverable.findById(id)
      .populate('project_requirement_id')
      .populate('freelancer_id')
      .populate('company_id')
      .populate('deliverables.approved_by', 'email');
  }

  public async updateMilestone(id: string, data: UpdateMilestoneDTO): Promise<any | null> {
    const updateData: any = { ...data };
    if (data.planned_end_date) {
      updateData.due_date = data.planned_end_date;
    }

    const milestone = await MilestoneDeliverable.findByIdAndUpdate(id, updateData, { new: true });

    if (milestone && data.status === 'in_progress' && !milestone.actual_start_date) {
      milestone.actual_start_date = new Date();
      await milestone.save();
    }

    return milestone;
  }

  public async deleteMilestone(id: string): Promise<boolean> {
    const result = await MilestoneDeliverable.findByIdAndDelete(id);
    return !!result;
  }

  public async startMilestone(id: string): Promise<any | null> {
    return this.updateMilestone(id, {
      status: 'in_progress',
    });
  }

  public async submitMilestone(id: string, deliverables: DeliverableDTO[]): Promise<any | null> {
    const milestone = await MilestoneDeliverable.findById(id);
    if (!milestone) return null;

    (milestone as any).deliverables = deliverables.map((d) => ({
      ...d,
      delivered_at: new Date(),
      is_approved: false,
    }));
    (milestone as any).status = 'submitted';
    (milestone as any).submitted_at = new Date();
    (milestone as any).completion_percentage = 100;

    await milestone.save();

    const project = await ProjectRequirement.findById((milestone as any).project_requirement_id);
    if (project) {
      await MessageService.createSystemMessage(
        (project as any).company_id.toString(),
        `里程碑已提交 - ${(milestone as any).milestone_name}`,
        `里程碑"${(milestone as any).milestone_name}"已提交交付物，请审核。`,
        'project',
        `/projects/${project._id}/milestones/${milestone._id}`,
        milestone._id.toString()
      );
    }

    return milestone;
  }

  public async approveMilestone(
    id: string,
    approvedBy: string,
    comment?: string
  ): Promise<any | null> {
    const milestone = await MilestoneDeliverable.findById(id);
    if (!milestone) return null;

    (milestone as any).status = 'approved';
    (milestone as any).approved_at = new Date();
    (milestone as any).approved_by = approvedBy as any;

    if ((milestone as any).deliverables) {
      for (const deliverable of (milestone as any).deliverables) {
        deliverable.is_approved = true;
        deliverable.approved_at = new Date();
        deliverable.approved_by = approvedBy as any;
        if (comment) deliverable.approval_comment = comment;
      }
    }

    await milestone.save();

    await MessageService.createSystemMessage(
      (milestone as any).freelancer_id.toString(),
      `里程碑已批准 - ${(milestone as any).milestone_name}`,
      `您的里程碑"${(milestone as any).milestone_name}"已审核通过。`,
      'project',
      `/projects/${(milestone as any).project_requirement_id}/milestones/${milestone._id}`,
      milestone._id.toString()
    );

    return milestone;
  }

  public async rejectMilestone(
    id: string,
    rejectedBy: string,
    reason: string
  ): Promise<any | null> {
    const milestone = await MilestoneDeliverable.findById(id);
    if (!milestone) return null;

    (milestone as any).status = 'rejected';
    (milestone as any).rejection_reason = reason;
    (milestone as any).rejection_reasons.push({
      reason,
      rejection_date: new Date(),
      rejected_by: rejectedBy as any,
    });

    await milestone.save();

    await MessageService.createSystemMessage(
      (milestone as any).freelancer_id.toString(),
      `里程碑被驳回 - ${(milestone as any).milestone_name}`,
      `您的里程碑"${(milestone as any).milestone_name}"被驳回：${reason}`,
      'project',
      `/projects/${(milestone as any).project_requirement_id}/milestones/${milestone._id}`,
      milestone._id.toString()
    );

    return milestone;
  }

  public async getProjectProgress(projectId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    inProgressMilestones: number;
    overdueMilestones: number;
    overallProgress: number;
    milestones: any[];
  }> {
    const milestones = await MilestoneDeliverable.find({ project_requirement_id: projectId });

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m: any) => m.status === 'approved').length;
    const inProgressMilestones = milestones.filter((m: any) => m.status === 'in_progress').length;
    const overdueMilestones = milestones.filter((m: any) => m.status === 'overdue').length;

    const overallProgress =
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      totalMilestones,
      completedMilestones,
      inProgressMilestones,
      overdueMilestones,
      overallProgress,
      milestones,
    };
  }

  public async getAtRiskMilestones(days: number = 3): Promise<any[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return MilestoneDeliverable.find({
      status: { $in: ['planned', 'in_progress'] as any },
      due_date: {
        $gte: new Date(),
        $lte: targetDate,
      },
    }).populate('project_requirement_id');
  }

  public async getOverdueMilestones(): Promise<any[]> {
    return MilestoneDeliverable.find({
      status: { $in: ['planned', 'in_progress', 'at_risk'] as any },
      due_date: { $lt: new Date() },
    }).populate('project_requirement_id');
  }
}

export default MilestoneService.getInstance();
