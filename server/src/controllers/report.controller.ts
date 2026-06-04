import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import ReportService from '../services/report.service';

class ReportController {
  public getOverviewReport = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const period = ['monthly', 'quarterly', 'yearly'].includes(req.params.period)
        ? (req.params.period as 'monthly' | 'quarterly' | 'yearly')
        : 'monthly';

      const report = await ReportService.getOverviewReport(req.user, period);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public getIncomeReport = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = (req.user as any)?.user_type;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { period, year, month, quarter } = req.query;

      const report = await ReportService.getIncomeReport(
        userId,
        userType === 'HR Recruiter' ? 'company' : 'freelancer',
        {
          period: (period as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
          year: year ? parseInt(year as string) : undefined,
          month: month ? parseInt(month as string) : undefined,
          quarter: quarter ? parseInt(quarter as string) : undefined,
        }
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public getProjectIncomeBreakdown = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = (req.user as any)?.user_type;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { year, limit } = req.query;

      const report = await ReportService.getProjectIncomeBreakdown(
        userId,
        userType === 'HR Recruiter' ? 'company' : 'freelancer',
        {
          year: year ? parseInt(year as string) : undefined,
          limit: limit ? parseInt(limit as string) : 10,
        }
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public getExpenseReport = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { period, year } = req.query;

      const report = await ReportService.getExpenseReport(userId, {
        period: (period as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
        year: year ? parseInt(year as string) : undefined,
      });

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public getProfitReport = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { period, year } = req.query;

      const report = await ReportService.getProfitReport(userId, {
        period: (period as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
        year: year ? parseInt(year as string) : undefined,
      });

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public getWorkLogStats = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { startDate, endDate, projectId } = req.query;

      const stats = await ReportService.getWorkLogStats(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        projectId: projectId as string,
      });

      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  };

  public exportReport = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = (req.user as any)?.user_type;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const { reportType, format, ...options } = req.query;

      const data = await ReportService.exportReport(
        userId,
        userType === 'HR Recruiter' ? 'company' : 'freelancer',
        reportType as 'income' | 'expense' | 'profit',
        (format as 'json' | 'csv') || 'json',
        options
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);
        res.send(data);
      } else {
        res.json({ success: true, data: JSON.parse(data) });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message },
      });
    }
  };
}

export default new ReportController();
