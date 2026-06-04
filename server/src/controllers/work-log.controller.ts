import { Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import WorkLog from "../models/freelancer/work_log.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import UserAccount from "../models/user/user-account.model";
import { BadRequestError, NotFoundError } from "../errors";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";
import NotificationHelper from "../services/notification-helper.service";

export default class WorkLogController {
  private static normalizeWorkType(value: unknown): string {
    const raw = typeof value === "string" ? value : "";
    const map: Record<string, string> = {
      remote: "remote_work",
      onsite: "onsite_dev",
      travel: "business_trip",
      requirement: "requirement_analysis",
      "远程工作": "remote_work",
      "现场开发": "onsite_dev",
      "会议": "meeting",
      "培训": "training",
      "出差": "business_trip",
      "代码评审": "code_review",
      "问题修复": "bug_fix",
      "需求分析": "requirement_analysis",
      "文档编写": "documentation",
      "测试": "testing",
      "部署": "deployment",
      "其他": "other",
    };
    return map[raw] || raw || "remote_work";
  }

  private static async getFreelancerProfile(userId: mongoose.Types.ObjectId | string) {
    return FreelancerProfile.findOne({ user_id: userId });
  }

  private static async resolveProjectRequirement(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const project = await ProjectRequirement.findById(id);
    if (project) return project;
    return ProjectRequirement.findOne({ job_post_id: id });
  }

  private static async assertCompanyCanManageWorkLog(user: any, workLog: any) {
    const role = (user?.role || user?.user_type_id?.user_type_name || "").toLowerCase().replace(/[_\s]/g, "_");
    if (role === "admin") return;

    const userAccount = await UserAccount.findById(user?._id || user?.id);
    if (!userAccount?.company_id || userAccount.company_id.toString() !== workLog.company_id?.toString()) {
      throw new BadRequestError("You do not have permission to manage this work log", []);
    }
  }

  private static validateWorkWindow(workPeriodStart: unknown, workPeriodEnd: unknown, hoursWorked: unknown) {
    const start = new Date(workPeriodStart as string);
    const end = new Date(workPeriodEnd as string);
    const hours = Number(hoursWorked);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestError("Work period start and end must be valid dates", []);
    }
    if (end <= start) {
      throw new BadRequestError("Work period end must be after start", []);
    }

    const periodHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours > periodHours + 0.01) {
      throw new BadRequestError("Hours worked cannot exceed the work period duration", []);
    }
  }

  public static async getWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const pageNum = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;
      const { project_id, status, work_date_from, work_date_to, group_by } = req.query;

      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: { current_page: pageNum, total_pages: 0, total_items: 0, items_per_page: limitNum },
        });
      }

      const query: any = { freelancer_id: freelancerProfile._id };
      if (project_id) query.project_requirement_id = project_id;
      if (status) query.status = status;
      if (work_date_from || work_date_to) {
        query.work_date = {};
        if (work_date_from) query.work_date.$gte = new Date(work_date_from as string);
        if (work_date_to) query.work_date.$lte = new Date(work_date_to as string);
      }

      if (group_by === "project") {
        const grouped = await WorkLog.aggregate([
          { $match: query },
          { $group: { _id: "$project_requirement_id", total_hours: { $sum: "$hours_worked" }, count: { $sum: 1 } } },
          { $skip: skip },
          { $limit: limitNum },
        ]);
        return res.status(StatusCodes.OK).json({
          grouped,
          pagination: { current_page: pageNum, total_items: grouped.length, items_per_page: limitNum },
        });
      }

      const [workLogs, total] = await Promise.all([
        WorkLog.find(query)
          .populate("project_requirement_id", "project_title")
          .sort({ work_date: -1, created_at: -1 })
          .skip(skip)
          .limit(limitNum),
        WorkLog.countDocuments(query),
      ]);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkLogById(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new NotFoundError("Freelancer profile not found", []);

      const workLog = await WorkLog.findOne({ _id: req.params.id, freelancer_id: freelancerProfile._id })
        .populate("project_requirement_id", "project_title");
      if (!workLog) throw new NotFoundError("Work log not found", []);

      res.status(StatusCodes.OK).json(workLog);
    } catch (error) {
      next(error);
    }
  }

  public static async createWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const {
        project_requirement_id,
        company_id,
        affiliation_id,
        work_period_start,
        work_period_end,
        work_date,
        hours_worked,
        work_type,
        work_description,
        description,
        work_content_detail,
        notes,
      } = req.body;

      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) {
        throw new BadRequestError("Please complete your freelancer profile before creating work logs", []);
      }

      const project = await WorkLogController.resolveProjectRequirement(project_requirement_id);
      if (!project) throw new BadRequestError("Project not found", []);
      if (!["published", "in_progress", "发布", "进行中"].includes(project.status)) {
        throw new BadRequestError(
          `Cannot create work log for project with status: ${project.status}. Only published or in_progress projects can have work logs.`,
          []
        );
      }

      const workDateObj = new Date(work_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (workDateObj > today) throw new BadRequestError("Work date cannot be in the future", []);
      if (hours_worked <= 0 || hours_worked > 24) {
        throw new BadRequestError("Hours worked must be between 0 and 24", []);
      }
      WorkLogController.validateWorkWindow(work_period_start, work_period_end, hours_worked);

      const existingWorkLog = await WorkLog.findOne({
        freelancer_id: freelancerProfile._id,
        project_requirement_id: project._id,
        work_date: workDateObj,
      });
      if (existingWorkLog) {
        throw new BadRequestError("A work log already exists for this project on the same date", []);
      }

      const workLog = new WorkLog({
        freelancer_id: freelancerProfile._id,
        project_requirement_id: project._id,
        company_id: company_id || project.company_id,
        affiliation_id,
        work_period_start: new Date(work_period_start),
        work_period_end: new Date(work_period_end),
        work_date: workDateObj,
        hours_worked,
        work_type: WorkLogController.normalizeWorkType(work_type),
        work_description: work_description || description,
        work_content_detail,
        notes,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
      });

      await workLog.save();
      res.status(StatusCodes.CREATED).json({ message: "Work log created successfully", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async updateWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new NotFoundError("Freelancer profile not found", []);

      const workLog = await WorkLog.findOne({ _id: req.params.id, freelancer_id: freelancerProfile._id });
      if (!workLog) throw new NotFoundError("Work log not found", []);
      if (!["draft", "rejected"].includes(workLog.status)) {
        throw new BadRequestError(`Cannot update work log with status: ${workLog.status}.`, []);
      }

      const nextStart = req.body.work_period_start ?? workLog.work_period_start;
      const nextEnd = req.body.work_period_end ?? workLog.work_period_end;
      const nextHours = req.body.hours_worked ?? workLog.hours_worked;
      WorkLogController.validateWorkWindow(nextStart, nextEnd, nextHours);

      const allowedUpdates = [
        "work_period_start",
        "work_period_end",
        "work_date",
        "hours_worked",
        "work_type",
        "work_description",
        "work_content_detail",
        "notes",
      ];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          (workLog as any)[field] = field === "work_type"
            ? WorkLogController.normalizeWorkType(req.body[field])
            : req.body[field];
        }
      });
      if (req.body.description !== undefined && req.body.work_description === undefined) {
        workLog.work_description = req.body.description;
      }

      workLog.updated_at = new Date();
      await workLog.save();
      res.status(StatusCodes.OK).json({ message: "Work log updated successfully", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new NotFoundError("Freelancer profile not found", []);

      const workLog = await WorkLog.findOne({ _id: req.params.id, freelancer_id: freelancerProfile._id });
      if (!workLog) throw new NotFoundError("Work log not found", []);
      if (workLog.status !== "draft") {
        throw new BadRequestError(`Cannot delete work log with status: ${workLog.status}.`, []);
      }

      await WorkLog.findByIdAndDelete(req.params.id);
      res.status(StatusCodes.OK).json({ message: "Work log deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  public static async submitWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new NotFoundError("Freelancer profile not found", []);

      const workLog = await WorkLog.findOne({ _id: req.params.id, freelancer_id: freelancerProfile._id });
      if (!workLog) throw new NotFoundError("Work log not found", []);
      if (!["draft", "rejected"].includes(workLog.status)) {
        throw new BadRequestError(`Cannot submit work log with status: ${workLog.status}.`, []);
      }

      workLog.status = "submitted";
      workLog.submitted_at = new Date();
      workLog.rejection_reason = undefined;
      workLog.rejected_by = undefined;
      workLog.rejected_at = undefined;
      workLog.updated_at = new Date();
      await workLog.save();

      if (workLog.company_id) {
        NotificationHelper.sendWorkLogSubmittedNotification(
          user._id.toString(),
          workLog.company_id.toString(),
          workLog._id.toString(),
          workLog.hours_worked
        ).catch((err) => console.error("Failed to send notification:", err));
      }

      res.status(StatusCodes.OK).json({ message: "Work log submitted successfully", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async withdrawWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new NotFoundError("Freelancer profile not found", []);

      const workLog = await WorkLog.findOne({ _id: req.params.id, freelancer_id: freelancerProfile._id });
      if (!workLog) throw new NotFoundError("Work log not found", []);
      if (["confirmed", "invoiced", "paid"].includes(workLog.status)) {
        throw new BadRequestError("Cannot withdraw a confirmed, invoiced, or paid work log.", []);
      }
      if (workLog.status !== "submitted") {
        throw new BadRequestError(`Cannot withdraw work log with status: ${workLog.status}.`, []);
      }

      workLog.status = "draft";
      workLog.submitted_at = undefined;
      workLog.updated_at = new Date();
      await workLog.save();
      res.status(StatusCodes.OK).json({ message: "Work log withdrawn successfully.", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async confirmWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const workLog = await WorkLog.findById(req.params.id);
      if (!workLog) throw new NotFoundError("Work log not found", []);
      await WorkLogController.assertCompanyCanManageWorkLog(user, workLog);
      if (workLog.status !== "submitted") {
        throw new BadRequestError(`Cannot confirm work log with status: ${workLog.status}.`, []);
      }

      workLog.status = "confirmed";
      workLog.confirmed_at = new Date();
      workLog.confirmed_by = user._id;
      workLog.updated_at = new Date();
      if (req.body.billing_info) workLog.billing_info = req.body.billing_info;
      await workLog.save();

      NotificationHelper.sendWorkLogConfirmedNotification(
        workLog.freelancer_id.toString(),
        workLog._id.toString(),
        workLog.hours_worked
      ).catch((err) => console.error("Failed to send notification:", err));

      res.status(StatusCodes.OK).json({ message: "Work log confirmed successfully", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async rejectWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { rejection_reason } = req.body;
      if (!rejection_reason) throw new BadRequestError("Rejection reason is required", []);

      const workLog = await WorkLog.findById(req.params.id);
      if (!workLog) throw new NotFoundError("Work log not found", []);
      await WorkLogController.assertCompanyCanManageWorkLog(user, workLog);
      if (workLog.status !== "submitted") {
        throw new BadRequestError(`Cannot reject work log with status: ${workLog.status}.`, []);
      }

      workLog.status = "rejected";
      workLog.rejection_reason = rejection_reason;
      workLog.rejected_by = user._id;
      workLog.rejected_at = new Date();
      workLog.updated_at = new Date();
      await workLog.save();

      NotificationHelper.sendWorkLogRejectedNotification(
        workLog.freelancer_id.toString(),
        workLog._id.toString(),
        rejection_reason
      ).catch((err) => console.error("Failed to send notification:", err));

      res.status(StatusCodes.OK).json({ message: "Work log rejected", work_log: workLog });
    } catch (error) {
      next(error);
    }
  }

  public static async batchSubmitWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { work_log_ids } = req.body;
      if (!Array.isArray(work_log_ids) || work_log_ids.length === 0) {
        throw new BadRequestError("work_log_ids array is required", []);
      }

      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) throw new BadRequestError("Freelancer profile not found", []);

      const workLogs = await WorkLog.find({
        _id: { $in: work_log_ids },
        freelancer_id: freelancerProfile._id,
        status: { $in: ["draft", "rejected"] },
      });
      if (workLogs.length !== work_log_ids.length) {
        throw new BadRequestError("Some work logs not found or cannot be submitted", []);
      }

      await WorkLog.updateMany(
        { _id: { $in: work_log_ids } },
        {
          $set: { status: "submitted", submitted_at: new Date(), updated_at: new Date() },
          $unset: { rejection_reason: "", rejected_by: "", rejected_at: "" },
        }
      );
      res.status(StatusCodes.OK).json({ message: `${workLogs.length} work logs submitted successfully` });
    } catch (error) {
      next(error);
    }
  }

  public static async batchConfirmWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { work_log_ids, billing_info } = req.body;
      if (!Array.isArray(work_log_ids) || work_log_ids.length === 0) {
        throw new BadRequestError("work_log_ids array is required", []);
      }

      const user = req.user as any;
      const role = (user?.role || user?.user_type_id?.user_type_name || "").toLowerCase().replace(/[_\s]/g, "_");
      const query: any = { _id: { $in: work_log_ids }, status: "submitted" };
      if (role !== "admin") {
        const userAccount = await UserAccount.findById(user?._id || user?.id);
        if (!userAccount?.company_id) {
          throw new BadRequestError("You do not have permission to confirm these work logs", []);
        }
        query.company_id = userAccount.company_id;
      }

      const workLogs = await WorkLog.find(query);
      if (workLogs.length !== work_log_ids.length) {
        throw new BadRequestError("Some work logs not found or are not in submitted status", []);
      }

      const updateData: any = {
        status: "confirmed",
        confirmed_at: new Date(),
        confirmed_by: user._id,
        updated_at: new Date(),
      };
      if (billing_info) updateData.billing_info = billing_info;

      await WorkLog.updateMany({ _id: { $in: work_log_ids } }, { $set: updateData });
      res.status(StatusCodes.OK).json({ message: `${workLogs.length} work logs confirmed successfully` });
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkLogSummary(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { project_id, period_start, period_end } = req.query;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({
          total_hours: 0,
          total_logs: 0,
          by_status: [],
          status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0, invoiced: 0, paid: 0 },
        });
      }

      const matchQuery: any = { freelancer_id: freelancerProfile._id };
      if (project_id) matchQuery.project_requirement_id = project_id;
      if (period_start || period_end) {
        matchQuery.work_date = {};
        if (period_start) matchQuery.work_date.$gte = new Date(period_start as string);
        if (period_end) matchQuery.work_date.$lte = new Date(period_end as string);
      }

      const [summary, statusCounts] = await Promise.all([
        WorkLog.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, total_hours: { $sum: "$hours_worked" }, total_logs: { $sum: 1 }, by_status: { $push: { status: "$status", hours: "$hours_worked" } } } },
          { $project: { _id: 0, total_hours: 1, total_logs: 1, by_status: 1 } },
        ]),
        WorkLog.aggregate([{ $match: matchQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

      const status_count_map: Record<string, number> = {
        draft: 0,
        submitted: 0,
        confirmed: 0,
        rejected: 0,
        invoiced: 0,
        paid: 0,
      };
      statusCounts.forEach((item: any) => {
        if (status_count_map[item._id] !== undefined) status_count_map[item._id] = item.count;
      });

      const result = summary[0] || { total_hours: 0, total_logs: 0, by_status: [] };
      (result as any).status_counts = status_count_map;
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getPendingWorkLogsForCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const pageNum = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const userAccount = await UserAccount.findById(user._id);
      if (!userAccount?.company_id) {
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: { current_page: pageNum, total_pages: 0, total_items: 0, items_per_page: limitNum },
        });
      }

      const query: any = { status: "submitted", company_id: userAccount.company_id };
      if (req.query.project_id) query.project_requirement_id = req.query.project_id;

      const [workLogs, total] = await Promise.all([
        WorkLog.find(query)
          .populate("freelancer_id", "display_name freelancer_name email")
          .populate("project_requirement_id", "project_title")
          .sort({ submitted_at: -1 })
          .skip(skip)
          .limit(limitNum),
        WorkLog.countDocuments(query),
      ]);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHRWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const pageNum = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const userAccount = await UserAccount.findById(user._id);
      if (!userAccount?.company_id) {
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: { current_page: pageNum, total_pages: 0, total_items: 0, items_per_page: limitNum },
        });
      }

      const query: any = { company_id: userAccount.company_id };
      if (req.query.status) query.status = req.query.status;

      const [workLogs, total] = await Promise.all([
        WorkLog.find(query)
          .populate("freelancer_id", "display_name freelancer_name email")
          .populate({ path: "project_requirement_id", select: "project_title", populate: { path: "company_id", select: "company_name" } })
          .sort({ work_date: -1, created_at: -1 })
          .skip(skip)
          .limit(limitNum),
        WorkLog.countDocuments(query),
      ]);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAvailableProjects(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const freelancerProfile = await WorkLogController.getFreelancerProfile(user._id);
      if (!freelancerProfile) return res.status(StatusCodes.OK).json({ projects: [] });

      const JobPostActivity = mongoose.model("JobPostActivity");
      const acceptedApplications = await JobPostActivity.find({
        user_account_id: user._id,
        status: "accepted",
      }).select("job_post_id");

      const jobPostIds = acceptedApplications.map((app: any) => app.job_post_id);
      const projects = await ProjectRequirement.find({
        job_post_id: { $in: jobPostIds },
        status: { $in: ["published", "in_progress", "发布", "进行中"] },
        is_active: true,
      })
        .populate("company_id", "company_name")
        .populate("job_post_id")
        .sort({ created_date: -1 });

      res.status(StatusCodes.OK).json({ projects });
    } catch (error) {
      next(error);
    }
  }
}
