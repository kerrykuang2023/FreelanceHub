import FreelancerInvoice from '../models/freelancer/freelancer_invoice.model';
import WorkLog from '../models/freelancer/work_log.model';
import ProjectRequirement from '../models/freelancer/project_requirement.model';
import FreelancerProfile from '../models/freelancer/freelancer_profile.model';
import Company from '../models/company-profile/company.model';
import UserRole from '../models/user/user-role.model';

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

export type OverviewReportPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface OverviewReport {
  period: OverviewReportPeriod;
  scope: {
    roleType: string;
    viewType: 'admin' | 'company' | 'freelancer';
  };
  income: {
    total: number;
    byMonth: Array<{ month: string; amount: number }>;
    byProject: Array<{ project: string; amount: number }>;
  };
  expense: {
    total: number;
    byCategory: Array<{ category: string; amount: number }>;
  };
  profit: {
    total: number;
    margin: number;
  };
  worklogStats: {
    totalHours: number;
    billableHours: number;
    avgHoursPerDay: number;
  };
  worklogTrend: Array<{ date: string; hours: number }>;
  invoiceStats: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
  invoiceByMonth: Array<{ month: string; amount: number; count: number }>;
}

interface ReportScope {
  userId: string;
  roleType: string;
  viewType: 'admin' | 'company' | 'freelancer';
  companyId?: any;
  freelancerProfileId?: any;
}

interface DateBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

class ReportService {
  private static INSTANCE: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.INSTANCE) {
      ReportService.INSTANCE = new ReportService();
    }
    return ReportService.INSTANCE;
  }

  public async getOverviewReport(user: any, period: OverviewReportPeriod): Promise<OverviewReport> {
    const scope = await this.resolveScope(user);
    const { start, end } = this.getCurrentPeriodRange(period);
    const buckets = this.getRecentBuckets(period);
    const chartStart = buckets[0]?.start || start;
    const impossibleFilter = { _id: { $exists: false } };
    const invoiceScopeFilter = this.getScopedFilter(scope, 'invoice') || impossibleFilter;
    const workLogScopeFilter = this.getScopedFilter(scope, 'worklog') || impossibleFilter;

    const [invoices, workLogs] = await Promise.all([
      FreelancerInvoice.find({
        ...invoiceScopeFilter,
        created_at: { $gte: chartStart, $lte: end },
      })
        .populate('project_requirement_id', 'project_title')
        .lean(),
      WorkLog.find({
        ...workLogScopeFilter,
        work_date: { $gte: chartStart, $lte: end },
      })
        .populate('project_requirement_id', 'project_title')
        .lean(),
    ]);

    const currentInvoices = invoices.filter((invoice: any) => {
      const date = this.getInvoiceDate(invoice);
      return date >= start && date <= end;
    });
    const currentWorkLogs = workLogs.filter((workLog: any) => {
      const date = new Date(workLog.work_date || workLog.created_at);
      return date >= start && date <= end;
    });
    const paidInvoices = currentInvoices.filter((invoice: any) => invoice.status === 'paid');
    const currentPaidTotal = this.sumMoney(paidInvoices, 'total_amount');
    const paidInvoicesForChart = invoices.filter((invoice: any) => invoice.status === 'paid');

    const incomeByMonth = buckets.map((bucket) => ({
      month: bucket.label,
      amount: this.sumMoney(
        paidInvoicesForChart.filter((invoice: any) => this.isInBucket(this.getInvoiceDate(invoice), bucket)),
        'total_amount'
      ),
    }));

    const invoiceByMonth = buckets.map((bucket) => {
      const bucketInvoices = invoices.filter((invoice: any) => this.isInBucket(this.getInvoiceDate(invoice), bucket));
      return {
        month: bucket.label,
        amount: this.sumMoney(bucketInvoices.filter((invoice: any) => invoice.status === 'paid'), 'total_amount'),
        count: bucketInvoices.length,
      };
    });

    const worklogTrend = buckets.map((bucket) => ({
      date: bucket.label,
      hours: this.sumHours(workLogs.filter((workLog: any) => this.isInBucket(new Date(workLog.work_date), bucket))),
    }));

    const projectTotals = new Map<string, number>();
    for (const invoice of paidInvoices) {
      const title = this.getProjectTitle(invoice);
      projectTotals.set(title, (projectTotals.get(title) || 0) + Number((invoice as any).total_amount || 0));
    }

    const byProject = Array.from(projectTotals.entries())
      .map(([project, amount]) => ({ project, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const totalHours = this.sumHours(currentWorkLogs);
    const billableHours = this.sumHours(
      currentWorkLogs.filter((workLog: any) => ['confirmed', 'invoiced', 'paid'].includes(workLog.status))
    );
    const workDays = new Set(
      currentWorkLogs.map((workLog: any) => new Date(workLog.work_date).toISOString().slice(0, 10))
    );
    const avgHoursPerDay = workDays.size > 0 ? Math.round((totalHours / workDays.size) * 10) / 10 : 0;

    const invoiceStats = {
      total: currentInvoices.length,
      pending: currentInvoices.filter((invoice: any) => invoice.status === 'submitted').length,
      approved: currentInvoices.filter((invoice: any) => invoice.status === 'approved').length,
      paid: currentInvoices.filter((invoice: any) => invoice.status === 'paid').length,
    };

    const expenseTotal = scope.viewType === 'freelancer' ? 0 : currentPaidTotal;
    const profitTotal = currentPaidTotal - expenseTotal;
    const profitMargin = currentPaidTotal > 0 ? Math.round((profitTotal / currentPaidTotal) * 100) : 0;

    return {
      period,
      scope: {
        roleType: scope.roleType,
        viewType: scope.viewType,
      },
      income: {
        total: currentPaidTotal,
        byMonth: incomeByMonth,
        byProject,
      },
      expense: {
        total: expenseTotal,
        byCategory: scope.viewType === 'freelancer' ? [] : [{ category: '顾问服务费', amount: expenseTotal }],
      },
      profit: {
        total: profitTotal,
        margin: profitMargin,
      },
      worklogStats: {
        totalHours,
        billableHours,
        avgHoursPerDay,
      },
      worklogTrend,
      invoiceStats,
      invoiceByMonth,
    };
  }

  private async resolveScope(user: any): Promise<ReportScope> {
    const userId = (user?._id || user?.id)?.toString();
    const activeRole = userId
      ? await UserRole.findOne({ user_id: userId, is_active: true, status: 'approved' }).lean()
      : null;
    const rawRole =
      activeRole?.role_type ||
      user?.user_type ||
      user?.user_type_name ||
      user?.user_type_id?.user_type_name ||
      'job_seeker';
    const roleType = rawRole === 'company_user' ? 'hr_recruiter' : rawRole;

    if (roleType === 'admin') {
      return { userId, roleType, viewType: 'admin' };
    }

    if (roleType === 'hr_recruiter') {
      const companyFromRole = (activeRole as any)?.role_specific_data?.company_id;
      const companyFromUser = user?.company_id?._id || user?.company_id;
      const ownedCompany = userId
        ? await Company.findOne({ created_by: userId }).select('_id').lean()
        : null;
      return {
        userId,
        roleType,
        viewType: 'company',
        companyId: companyFromRole || companyFromUser || ownedCompany?._id,
      };
    }

    const freelancerProfile = userId
      ? await FreelancerProfile.findOne({ user_id: userId }).select('_id').lean()
      : null;

    return {
      userId,
      roleType,
      viewType: 'freelancer',
      freelancerProfileId: freelancerProfile?._id,
    };
  }

  private getScopedFilter(scope: ReportScope, target: 'invoice' | 'worklog') {
    if (scope.viewType === 'admin') return {};
    if (scope.viewType === 'company') {
      return scope.companyId ? { company_id: scope.companyId } : null;
    }
    return scope.freelancerProfileId ? { freelancer_id: scope.freelancerProfileId } : null;
  }

  private getCurrentPeriodRange(period: OverviewReportPeriod) {
    const now = new Date();
    let start: Date;

    if (period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'quarterly') {
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end: now };
  }

  private getRecentBuckets(period: OverviewReportPeriod): DateBucket[] {
    const now = new Date();
    const buckets: DateBucket[] = [];

    if (period === 'yearly') {
      for (let offset = 4; offset >= 0; offset -= 1) {
        const year = now.getFullYear() - offset;
        buckets.push({
          key: `${year}`,
          label: `${year}`,
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31, 23, 59, 59, 999),
        });
      }
      return buckets;
    }

    if (period === 'quarterly') {
      const currentQuarterIndex = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
      for (let offset = 3; offset >= 0; offset -= 1) {
        const quarterIndex = currentQuarterIndex - offset;
        const year = Math.floor(quarterIndex / 4);
        const quarter = quarterIndex % 4;
        buckets.push({
          key: `${year}-Q${quarter + 1}`,
          label: `${year}-Q${quarter + 1}`,
          start: new Date(year, quarter * 3, 1),
          end: new Date(year, quarter * 3 + 3, 0, 23, 59, 59, 999),
        });
      }
      return buckets;
    }

    for (let offset = 5; offset >= 0; offset -= 1) {
      const bucketStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = bucketStart.getFullYear();
      const month = bucketStart.getMonth();
      const label = `${year}-${String(month + 1).padStart(2, '0')}`;
      buckets.push({
        key: label,
        label,
        start: bucketStart,
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      });
    }

    return buckets;
  }

  private getInvoiceDate(invoice: any): Date {
    return new Date(invoice.paid_date || invoice.issued_date || invoice.created_at || invoice.updated_at || Date.now());
  }

  private isInBucket(date: Date, bucket: DateBucket): boolean {
    return date >= bucket.start && date <= bucket.end;
  }

  private sumMoney(items: any[], field: string): number {
    return Math.round(items.reduce((sum, item) => sum + Number(item?.[field] || 0), 0) * 100) / 100;
  }

  private sumHours(workLogs: any[]): number {
    return Math.round(workLogs.reduce((sum, workLog) => sum + Number(workLog?.hours_worked || 0), 0) * 10) / 10;
  }

  private getProjectTitle(invoice: any): string {
    const project = invoice.project_requirement_id;
    if (project && typeof project === 'object' && project.project_title) {
      return project.project_title;
    }
    return '未关联项目';
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
