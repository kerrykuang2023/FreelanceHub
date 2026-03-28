import FreelancerInvoice from '../models/freelancer/freelancer_invoice.model';
import MilestoneDeliverable from '../models/freelancer/milestone_deliverable.model';
import ProjectRequirement from '../models/freelancer/project_requirement.model';
import ContractService from '../services/contract.service';
import MessageService from '../services/message.service';

interface ScheduledJob {
  id: string;
  interval: NodeJS.Timeout;
  callback: () => Promise<void>;
}

class SchedulerService {
  private static INSTANCE: SchedulerService;
  private jobs: ScheduledJob[] = [];

  public static getInstance(): SchedulerService {
    if (!SchedulerService.INSTANCE) {
      SchedulerService.INSTANCE = new SchedulerService();
    }
    return SchedulerService.INSTANCE;
  }

  public startAllJobs(): void {
    this.startContractExpirationCheck();
    this.startPaymentReminderCheck();
    this.startMilestoneWarningCheck();
    this.startInvoiceOverdueCheck();
    console.log('✅ All scheduled jobs started');
  }

  public stopAllJobs(): void {
    for (const job of this.jobs) {
      clearInterval(job.interval);
    }
    this.jobs = [];
    console.log('🛑 All scheduled jobs stopped');
  }

  private scheduleJob(id: string, callback: () => Promise<void>, intervalMs: number): void {
    const job: ScheduledJob = {
      id,
      interval: setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`❌ Job ${id} error:`, error);
        }
      }, intervalMs),
      callback,
    };
    this.jobs.push(job);
  }

  private startContractExpirationCheck(): void {
    this.scheduleJob('contract-expiration', async () => {
      console.log('⏰ Running contract expiration check...');
      await this.checkContractExpiration(30);
      await this.checkContractExpiration(7);
      await this.expireContracts();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkContractExpiration(days: number): Promise<void> {
    const contracts = await ContractService.getExpiringContracts(days);

    for (const contract of contracts) {
      const freelancerId = contract.freelancer_id as any;
      const companyId = contract.company_id as any;

      const message = days === 7
        ? `紧急提醒：您的合同"${contract.title}"将在7天后到期，请及时处理续约事宜。`
        : `提醒：您的合同"${contract.title}"将在${days}天后到期。`;

      await MessageService.createReminder(
        freelancerId.toString(),
        `合同即将到期 - ${contract.title}`,
        message,
        'contract',
        `/contracts/${contract._id}`,
        contract._id.toString()
      );

      await MessageService.createReminder(
        companyId.toString(),
        `合同即将到期 - ${contract.title}`,
        message,
        'contract',
        `/contracts/${contract._id}`,
        contract._id.toString()
      );
    }

    console.log(`✅ Sent ${contracts.length} contract expiration reminders for ${days} days`);
  }

  private async expireContracts(): Promise<void> {
    const count = await ContractService.expireContracts();
    console.log(`✅ Expired ${count} contracts`);
  }

  private startPaymentReminderCheck(): void {
    this.scheduleJob('payment-reminder', async () => {
      console.log('⏰ Running payment reminder check...');
      await this.checkOverduePayments(7);
      await this.checkOverduePayments(14);
      await this.checkOverduePayments(30);
    }, 24 * 60 * 60 * 1000);
  }

  private async checkOverduePayments(days: number): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);

    const invoices = await FreelancerInvoice.find({
      status: 'approved',
      approved_at: { $lte: targetDate },
    }).populate('freelancer_id company_id');

    for (const invoice of invoices) {
      const freelancerId = (invoice.freelancer_id as any)?._id?.toString();
      const companyId = (invoice.company_id as any)?._id?.toString();

      let message: string;
      if (days === 7) {
        message = `提醒：发票${invoice.invoice_number}已审核通过7天，请尽快安排付款。`;
      } else if (days === 14) {
        message = `催款通知：发票${invoice.invoice_number}已审核通过14天，请尽快付款。`;
      } else {
        message = `逾期警告：发票${invoice.invoice_number}已逾期30天，请立即处理！`;
      }

      if (companyId) {
        await MessageService.createReminder(
          companyId,
          `付款提醒 - ${invoice.invoice_number}`,
          message,
          'payment',
          `/invoices/${invoice._id}`,
          invoice._id.toString()
        );
      }
    }

    console.log(`✅ Sent ${invoices.length} payment reminders for ${days} days`);
  }

  private startMilestoneWarningCheck(): void {
    this.scheduleJob('milestone-warning', async () => {
      console.log('⏰ Running milestone warning check...');
      await this.checkMilestoneWarnings(3);
      await this.checkOverdueMilestones();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkMilestoneWarnings(days: number): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const milestones = await MilestoneDeliverable.find({
      status: { $in: ['pending', 'in_progress'] },
      due_date: {
        $gte: new Date(),
        $lte: targetDate,
      },
    });

    for (const milestone of milestones) {
      const projectId = (milestone as any).project_requirement_id;
      if (!projectId) continue;

      const project = await ProjectRequirement.findById(projectId);
      if (!project) continue;

      const companyId = project.company_id?.toString();
      const message = `里程碑"${milestone.milestone_name}"将在${days}天后到期，请及时处理。`;

      if (companyId) {
        await MessageService.createReminder(
          companyId,
          `里程碑到期提醒 - ${milestone.milestone_name}`,
          message,
          'project',
          `/projects/${projectId}/milestones`,
          milestone._id.toString()
        );
      }

      milestone.status = 'at_risk';
      await milestone.save();
    }

    console.log(`✅ Sent ${milestones.length} milestone warnings`);
  }

  private async checkOverdueMilestones(): Promise<void> {
    const milestones = await MilestoneDeliverable.find({
      status: { $in: ['pending', 'in_progress', 'at_risk'] },
      due_date: { $lt: new Date() },
    });

    for (const milestone of milestones) {
      const projectId = (milestone as any).project_requirement_id;
      if (!projectId) continue;

      const project = await ProjectRequirement.findById(projectId);
      if (!project) continue;

      const companyId = project.company_id?.toString();
      const message = `警告：里程碑"${milestone.milestone_name}"已逾期，请立即处理！`;

      if (companyId) {
        await MessageService.createReminder(
          companyId,
          `里程碑逾期警告 - ${milestone.milestone_name}`,
          message,
          'project',
          `/projects/${projectId}/milestones`,
          milestone._id.toString()
        );
      }

      milestone.status = 'overdue';
      await milestone.save();
    }

    console.log(`✅ Marked ${milestones.length} overdue milestones`);
  }

  private startInvoiceOverdueCheck(): void {
    this.scheduleJob('invoice-overdue', async () => {
      console.log('⏰ Running invoice overdue check...');
      await this.markOverdueInvoices();
    }, 24 * 60 * 60 * 1000);
  }

  private async markOverdueInvoices(): Promise<void> {
    const result = await FreelancerInvoice.updateMany(
      {
        status: 'approved',
        due_date: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );

    console.log(`✅ Marked ${result.modifiedCount} invoices as overdue`);
  }
}

export default SchedulerService.getInstance();
