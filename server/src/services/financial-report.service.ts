import mongoose from "mongoose";
import Invoice from "../models/freelancer/freelancer_invoice.model";
import WorkLog from "../models/freelancer/work_log.model";
import JobPost from "../models/job/job_post.model";

interface DateRange {
  start: Date;
  end: Date;
}

interface FinancialReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalWorkHours: number;
    averageHourlyRate: number;
  };
  breakdown: {
    byMonth: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    byProject: Array<{
      projectId: string;
      projectName: string;
      revenue: number;
      hours: number;
    }>;
    byClient: Array<{
      clientId: string;
      clientName: string;
      revenue: number;
      invoiceCount: number;
    }>;
  };
  trends: {
    revenueGrowth: number;
    hoursGrowth: number;
    invoiceGrowth: number;
  };
}

class FinancialReportService {
  public static async generateReport(
    userId: string,
    dateRange: DateRange,
    groupBy: "month" | "quarter" | "year" = "month"
  ): Promise<FinancialReport> {
    const { start, end } = dateRange;

    const invoices = await Invoice.find({
      freelancer_id: userId,
      created_at: { $gte: start, $lte: end },
    }).populate("company_id project_requirement_id");

    const workLogs = await WorkLog.find({
      freelancer_id: userId,
      work_date: { $gte: start, $lte: end },
      status: "confirmed",
    }).populate("project_requirement_id");

    const totalRevenue = invoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

    const pendingAmount = invoices
      .filter((inv: any) => inv.status === "submitted" || inv.status === "approved")
      .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

    const totalWorkHours = workLogs.reduce(
      (sum: number, log: any) => sum + (log.hours_worked || 0),
      0
    );

    const averageHourlyRate = totalWorkHours > 0 ? totalRevenue / totalWorkHours : 0;

    const byMonth = await this.groupByPeriod(invoices, groupBy);
    const byProject = await this.groupByProject(invoices, workLogs);
    const byClient = await this.groupByClient(invoices);

    const previousPeriodStart = new Date(start);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
    const previousPeriodEnd = new Date(start);

    const previousInvoices = await Invoice.find({
      freelancer_id: userId,
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    });

    const previousRevenue = previousInvoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      period: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      summary: {
        totalRevenue,
        totalExpenses: 0,
        netProfit: totalRevenue,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter((inv: any) => inv.status === "paid").length,
        pendingInvoices: invoices.filter(
          (inv: any) => inv.status === "submitted" || inv.status === "approved"
        ).length,
        totalWorkHours,
        averageHourlyRate,
      },
      breakdown: {
        byMonth,
        byProject,
        byClient,
      },
      trends: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        hoursGrowth: 0,
        invoiceGrowth: 0,
      },
    };
  }

  private static async groupByPeriod(
    invoices: any[],
    groupBy: "month" | "quarter" | "year"
  ): Promise<Array<{ month: string; revenue: number; expenses: number; profit: number }>> {
    const grouped: Record<string, { revenue: number; expenses: number }> = {};

    invoices.forEach((inv: any) => {
      const date = new Date(inv.created_at);
      let key: string;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "quarter") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        key = String(date.getFullYear());
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, expenses: 0 };
      }

      if (inv.status === "paid") {
        grouped[key].revenue += inv.total_amount || 0;
      }
    });

    return Object.entries(grouped)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static async groupByProject(
    invoices: any[],
    workLogs: any[]
  ): Promise<Array<{ projectId: string; projectName: string; revenue: number; hours: number }>> {
    const grouped: Record<string, { name: string; revenue: number; hours: number }> = {};

    invoices.forEach((inv: any) => {
      const projectId = inv.project_requirement_id?._id?.toString() || "unknown";
      const projectName = inv.project_requirement_id?.job_title || "Unknown Project";

      if (!grouped[projectId]) {
        grouped[projectId] = { name: projectName, revenue: 0, hours: 0 };
      }

      if (inv.status === "paid") {
        grouped[projectId].revenue += inv.total_amount || 0;
      }
    });

    workLogs.forEach((log: any) => {
      const projectId = log.project_requirement_id?._id?.toString() || "unknown";
      if (grouped[projectId]) {
        grouped[projectId].hours += log.hours_worked || 0;
      }
    });

    return Object.entries(grouped)
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.name,
        revenue: data.revenue,
        hours: data.hours,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private static async groupByClient(
    invoices: any[]
  ): Promise<Array<{ clientId: string; clientName: string; revenue: number; invoiceCount: number }>> {
    const grouped: Record<string, { name: string; revenue: number; count: number }> = {};

    invoices.forEach((inv: any) => {
      const clientId = inv.company_id?._id?.toString() || "unknown";
      const clientName = inv.company_id?.company_name || "Unknown Client";

      if (!grouped[clientId]) {
        grouped[clientId] = { name: clientName, revenue: 0, count: 0 };
      }

      if (inv.status === "paid") {
        grouped[clientId].revenue += inv.total_amount || 0;
      }
      grouped[clientId].count++;
    });

    return Object.entries(grouped)
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        revenue: data.revenue,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  public static async getDashboardStats(userId: string): Promise<{
    thisMonth: { revenue: number; hours: number; invoices: number };
    lastMonth: { revenue: number; hours: number; invoices: number };
    pendingPayments: number;
    overdueInvoices: number;
  }> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthInvoices = await Invoice.find({
      freelancer_id: userId,
      status: "paid",
      paid_at: { $gte: thisMonthStart },
    });

    const lastMonthInvoices = await Invoice.find({
      freelancer_id: userId,
      status: "paid",
      paid_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const thisMonthWorkLogs = await WorkLog.find({
      freelancer_id: userId,
      status: "confirmed",
      work_date: { $gte: thisMonthStart },
    });

    const lastMonthWorkLogs = await WorkLog.find({
      freelancer_id: userId,
      status: "confirmed",
      work_date: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const pendingInvoices = await Invoice.find({
      freelancer_id: userId,
      status: { $in: ["submitted", "approved"] },
    });

    const overdueInvoices = await Invoice.find({
      freelancer_id: userId,
      status: { $in: ["submitted", "approved"] },
      due_date: { $lt: now },
    });

    return {
      thisMonth: {
        revenue: thisMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        hours: thisMonthWorkLogs.reduce((sum, log) => sum + (log.hours_worked || 0), 0),
        invoices: thisMonthInvoices.length,
      },
      lastMonth: {
        revenue: lastMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        hours: lastMonthWorkLogs.reduce((sum, log) => sum + (log.hours_worked || 0), 0),
        invoices: lastMonthInvoices.length,
      },
      pendingPayments: pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      overdueInvoices: overdueInvoices.length,
    };
  }
}

export default FinancialReportService;
