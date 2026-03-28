import { Request, Response } from "express";
import Report from "../models/report/report.model";
import UserAccount from "../models/user/user-account.model";
import NotificationService from "../services/notification.service";
import CreditService from "../services/credit.service";
import { StatusCodes } from "http-status-codes";

export default class UserReportController {
  static async createReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { target_type, target_id, target_user_id, report_type, description, attachments } = req.body;

      if (!target_type || !target_id || !report_type || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const recentReports = await Report.countDocuments({
        reporter_id: user._id,
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (recentReports >= 10) {
        return res.status(429).json({ error: "Too many reports in the last 24 hours" });
      }

      const report = await Report.create({
        reporter_id: user._id,
        target_type,
        target_id,
        target_user_id,
        report_type,
        description,
        attachments: attachments || [],
        status: "pending",
        priority: this.calculatePriority(report_type),
      });

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Report submitted successfully",
        data: report,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit report" });
    }
  }

  static async getMyReports(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { reporter_id: user._id };
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate("target_user_id", "email first_name last_name"),
        Report.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  }

  static async getReportById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const report = await Report.findOne({
        _id: id,
        reporter_id: user._id,
      }).populate("target_user_id", "email first_name last_name");

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  }

  static async cancelReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const report = await Report.findOne({
        _id: id,
        reporter_id: user._id,
        status: "pending",
      });

      if (!report) {
        return res.status(404).json({ error: "Report not found or cannot be cancelled" });
      }

      report.status = "dismissed";
      report.review_notes = "Cancelled by reporter";
      await report.save();

      res.json({
        success: true,
        message: "Report cancelled successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel report" });
    }
  }

  static async getAllReports(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, report_type, priority } = req.query;

      const query: any = {};
      if (status) query.status = status;
      if (report_type) query.report_type = report_type;
      if (priority) query.priority = priority;

      const skip = (Number(page) - 1) * Number(limit);

      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate("reporter_id", "email first_name last_name")
          .populate("target_user_id", "email first_name last_name")
          .populate("reviewed_by", "email"),
        Report.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  }

  static async verifyReport(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { id } = req.params;
      const { action_taken, credit_deduction, review_notes } = req.body;

      const report = await Report.findById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.status !== "pending" && report.status !== "investigating") {
        return res.status(400).json({ error: "Report already processed" });
      }

      report.status = "verified";
      report.reviewed_by = adminUser._id;
      report.reviewed_at = new Date();
      report.review_notes = review_notes;
      report.action_taken = action_taken;
      await report.save();

      if (report.target_user_id && credit_deduction > 0) {
        await CreditService.addCredit(report.target_user_id.toString(), "violation", {
          amount: -Math.abs(credit_deduction),
          description: `违规处罚: ${report.report_type}`,
          referenceType: "report",
          referenceId: report._id.toString(),
          createdBy: adminUser._id.toString(),
        });
      }

      await NotificationService.createNotification({
        user_id: report.reporter_id.toString(),
        type: "system_announcement",
        title: "举报处理完成",
        message: `您提交的举报已被验证处理。${action_taken ? "处理结果: " + action_taken : ""}`,
        priority: "normal",
      });

      if (report.target_user_id) {
        await NotificationService.createNotification({
          user_id: report.target_user_id.toString(),
          type: "system_announcement",
          title: "违规通知",
          message: `您的行为被判定违规: ${report.report_type}。${action_taken ? "处理结果: " + action_taken : ""}`,
          priority: "high",
        });
      }

      res.json({
        success: true,
        message: "Report verified successfully",
        data: report,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify report" });
    }
  }

  static async dismissReport(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { id } = req.params;
      const { review_notes } = req.body;

      const report = await Report.findById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.status !== "pending" && report.status !== "investigating") {
        return res.status(400).json({ error: "Report already processed" });
      }

      report.status = "dismissed";
      report.reviewed_by = adminUser._id;
      report.reviewed_at = new Date();
      report.review_notes = review_notes || "Report dismissed";
      await report.save();

      await CreditService.addCredit(report.reporter_id.toString(), "report_invalid", {
        description: "无效举报",
        referenceType: "report",
        referenceId: report._id.toString(),
        createdBy: adminUser._id.toString(),
      });

      await NotificationService.createNotification({
        user_id: report.reporter_id.toString(),
        type: "system_announcement",
        title: "举报处理结果",
        message: `您提交的举报已被驳回。${review_notes ? "原因: " + review_notes : ""}`,
        priority: "normal",
      });

      res.json({
        success: true,
        message: "Report dismissed",
        data: report,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to dismiss report" });
    }
  }

  static async getReportStats(req: Request, res: Response) {
    try {
      const stats = await Report.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const typeStats = await Report.aggregate([
        {
          $group: {
            _id: "$report_type",
            count: { $sum: 1 },
          },
        },
      ]);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTrend = await Report.aggregate([
        {
          $match: {
            created_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const totalPending = await Report.countDocuments({ status: "pending" });
      const totalVerified = await Report.countDocuments({ status: "verified" });
      const totalDismissed = await Report.countDocuments({ status: "dismissed" });

      res.json({
        success: true,
        data: {
          byStatus: stats,
          byType: typeStats,
          recentTrend,
          summary: {
            totalPending,
            totalVerified,
            totalDismissed,
            total: totalPending + totalVerified + totalDismissed,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report stats" });
    }
  }

  static async startInvestigation(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { id } = req.params;

      const report = await Report.findById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.status !== "pending") {
        return res.status(400).json({ error: "Report is not in pending status" });
      }

      report.status = "investigating";
      report.reviewed_by = adminUser._id;
      report.reviewed_at = new Date();
      await report.save();

      res.json({
        success: true,
        message: "Investigation started",
        data: report,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start investigation" });
    }
  }

  private static calculatePriority(reportType: string): string {
    const highPriorityTypes: string[] = ["scam", "harassment"];
    const urgentTypes: string[] = [];

    if (urgentTypes.includes(reportType)) return "urgent";
    if (highPriorityTypes.includes(reportType)) return "high";
    return "medium";
  }
}
