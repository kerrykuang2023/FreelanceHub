import FreelancerInvoice from '../models/freelancer/freelancer_invoice.model';
import WorkLog from '../models/freelancer/work_log.model';
import ProjectRequirement from '../models/freelancer/project_requirement.model';
import FreelancerProfile from '../models/freelancer/freelancer_profile.model';
import Company from '../models/company-profile/company.model';

export interface IncomeReport {
  period: string;
  totalIncome: number;
  projectCount: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  currency: string;
}

export interface ProjectIncomeBreakdown {
  projectId: string;
  projectTitle: string;
  totalIncome: number;
  invoiceCount: number;
  percentage: number;
}

export interface ExpenseReport {
  period: string;
  totalExpense: number;
  projectCount: number;
  invoiceCount: number;
  currency: string;
}

export interface ProfitReport {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

class ReportService {
  private static INSTANCE: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.INSTANCE) {
      ReportService.INSTANCE = new ReportService();
    }
    return ReportService.INSTANCE;
  }

  public async getIncomeReport(
    userId: string,
    userType: 'freelancer' | 'company',
    options: {
      period: 'monthly' | 'quarterly' | 'yearly';
      year?: number;
      month?: number;
      quarter?: number;
    }
  ): Promise<IncomeReport[]> {
    const { period, year = new Date().getFullYear(), month, quarter } = options;

    const matchFilter: any = {
      status: 'paid',
    };

    if (userType === 'freelancer') {
      matchFilter.freelancer_id = userId;
    } else {
      matchFilter.company_id = userId;
    }

    let groupFormat: string;
    switch (period) {
      case 'monthly':
        groupFormat = '%Y-%m';
        break;
      case 'quarterly':
        groupFormat = '%Y-Q%q';
        break;
      case 'yearly':
      default:
        groupFormat = '%Y';
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: groupFormat, date: '$paid_date' } },
            currency: '$currency',
          },
          totalIncome: { $sum: '$total_amount' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.period': 1 } },
    ];

    const results = await FreelancerInvoice.aggregate(pipeline);

    return results.map((r) => ({
      period: r._id.period,
      totalIncome: r.totalIncome,
      projectCount: 0,
      invoiceCount: r.invoiceCount,
      paidCount: r.invoiceCount,
      pendingCount: 0,
      currency: r._id.currency,
    }));
  }

  public async getProjectIncomeBreakdown(
    userId: string,
    userType: 'freelancer' | 'company',
    options: { year?: number; limit?: number } = {}
  ): Promise<ProjectIncomeBreakdown[]> {
    const { year = new Date().getFullYear(), limit = 10 } = options;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const matchFilter: any = {
      status: 'paid',
      paid_date: { $gte: startOfYear, $lte: endOfYear },
    };

    if (userType === 'freelancer') {
      matchFilter.freelancer_id = userId;
    } else {
      matchFilter.company_id = userId;
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$project_id',
          totalIncome: { $sum: '$total_amount' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalIncome: -1 } },
      { $limit: limit },
    ];

    const results = await FreelancerInvoice.aggregate(pipeline);

    const totalIncome = results.reduce((sum, r) => sum + r.totalIncome, 0);

    const projectIds = results.map((r) => r._id);
    const projects = await ProjectRequirement.find({ _id: { $in: projectIds } });

    const projectMap = new Map(projects.map((p) => [p._id.toString(), p.project_title]));

    return results.map((r) => ({
      projectId: r._id.toString(),
      projectTitle: projectMap.get(r._id.toString()) || 'Unknown Project',
      totalIncome: r.totalIncome,
      invoiceCount: r.invoiceCount,
      percentage: totalIncome > 0 ? Math.round((r.totalIncome / totalIncome) * 100) : 0,
    }));
  }

  public async getExpenseReport(
    companyId: string,
    options: {
      period: 'monthly' | 'quarterly' | 'yearly';
      year?: number;
    }
  ): Promise<ExpenseReport[]> {
    const { period, year = new Date().getFullYear() } = options;

    let groupFormat: string;
    switch (period) {
      case 'monthly':
        groupFormat = '%Y-%m';
        break;
      case 'quarterly':
        groupFormat = '%Y-Q%q';
        break;
      case 'yearly':
      default:
        groupFormat = '%Y';
    }

    const pipeline: any[] = [
      {
        $match: {
          company_id: companyId,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: groupFormat, date: '$paid_date' } },
            currency: '$currency',
          },
          totalExpense: { $sum: '$total_amount' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.period': 1 } },
    ];

    const results = await FreelancerInvoice.aggregate(pipeline);

    return results.map((r) => ({
      period: r._id.period,
      totalExpense: r.totalExpense,
      projectCount: 0,
      invoiceCount: r.invoiceCount,
      currency: r._id.currency,
    }));
  }

  public async getProfitReport(
    companyId: string,
    options: {
      period: 'monthly' | 'quarterly' | 'yearly';
      year?: number;
    }
  ): Promise<ProfitReport[]> {
    const { period, year = new Date().getFullYear() } = options;

    const expenseReports = await this.getExpenseReport(companyId, { period, year });

    return expenseReports.map((report) => {
      const revenue = report.totalExpense * 1.1;
      const cost = report.totalExpense;
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        period: report.period,
        revenue,
        cost,
        profit,
        profitMargin,
      };
    });
  }

  public async getWorkLogStats(
    freelancerId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      projectId?: string;
    } = {}
  ): Promise<{
    totalHours: number;
    totalDays: number;
    billableAmount: number;
    byProject: Array<{
      projectId: string;
      projectTitle: string;
      hours: number;
      amount: number;
    }>;
  }> {
    const { startDate, endDate, projectId } = options;

    const matchFilter: any = {
      freelancer_id: freelancerId,
      status: { $in: ['confirmed', 'invoiced', 'paid'] },
    };

    if (startDate) matchFilter.work_date = { $gte: startDate };
    if (endDate) matchFilter.work_date = { ...matchFilter.work_date, $lte: endDate };
    if (projectId) matchFilter.project_requirement_id = projectId;

    const workLogs = await WorkLog.find(matchFilter).populate('project_requirement_id');

    const totalHours = workLogs.reduce((sum, wl) => sum + (wl.hours_worked || 0), 0);
    const totalDays = workLogs.length;

    const projectMap = new Map<string, { hours: number; amount: number; title: string }>();

    for (const wl of workLogs) {
      const projectId = wl.project_requirement_id?._id?.toString();
      if (!projectId) continue;

      const existing = projectMap.get(projectId) || { hours: 0, amount: 0, title: '' };
      existing.hours += wl.hours_worked || 0;
      existing.amount += wl.billing_info?.total_amount || wl.billing_info?.amount || 0;
      existing.title = (wl.project_requirement_id as any)?.project_title || '';
      projectMap.set(projectId, existing);
    }

    const byProject = Array.from(projectMap.entries()).map(([projectId, data]) => ({
      projectId,
      projectTitle: data.title,
      hours: data.hours,
      amount: data.amount,
    }));

    const billableAmount = byProject.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalHours,
      totalDays,
      billableAmount,
      byProject,
    };
  }

  public async exportReport(
    userId: string,
    userType: 'freelancer' | 'company',
    reportType: 'income' | 'expense' | 'profit',
    format: 'json' | 'csv',
    options: any
  ): Promise<string> {
    let data: any;

    switch (reportType) {
      case 'income':
        data = await this.getIncomeReport(userId, userType, options);
        break;
      case 'expense':
        data = await this.getExpenseReport(userId, options);
        break;
      case 'profit':
        data = await this.getProfitReport(userId, options);
        break;
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h];
        return typeof val === 'string' ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export default ReportService.getInstance();
