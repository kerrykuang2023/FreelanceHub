import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import WorkLog from "../models/freelancer/work_log.model";
import WorkLogBatch from "../models/freelancer/work_log_batch.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import UserAccount from "../models/user/user-account.model";
import { BadRequestError, NotFoundError } from "../errors";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";
import NotificationHelper from "../services/notification-helper.service";

export default class WorkLogController {
  public static async getWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const {
        page = "1",
        limit = "10",
        project_id,
        status,
        work_date_from,
        work_date_to,
        group_by
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: {
            current_page: pageNum,
            total_pages: 0,
            total_items: 0,
            items_per_page: limitNum
          }
        });
      }

      const query: any = { freelancer_id: freelancerProfile._id };

      if (project_id) {
        query.project_requirement_id = project_id;
      }

      if (status) {
        query.status = status;
      }

      if (work_date_from || work_date_to) {
        query.work_date = {};
        if (work_date_from) {
          query.work_date.$gte = new Date(work_date_from as string);
        }
        if (work_date_to) {
          query.work_date.$lte = new Date(work_date_to as string);
        }
      }

      let workLogs;
      let total;

      if (group_by === "project") {
        const aggregation = await WorkLog.aggregate([
          { $match: query },
          { $group: {
            _id: "$project_requirement_id",
            total_hours: { $sum: "$hours_worked" },
            count: { $sum: 1 }
          }},
          { $skip: skip },
          { $limit: limitNum }
        ]);

        return res.status(StatusCodes.OK).json({
          grouped: aggregation,
          pagination: {
            current_page: pageNum,
            total_items: total,
            items_per_page: limitNum
          }
        });
      }

      workLogs = await WorkLog.find(query)
        .populate("project_requirement_id", "project_title")
        .sort({ work_date: -1, created_at: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await WorkLog.countDocuments(query);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkLogById(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new NotFoundError("Freelancer profile not found", []);
      }

      const workLog = await WorkLog.findOne({
        _id: id,
        freelancer_id: freelancerProfile._id
      }).populate("project_requirement_id", "project_title");

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

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
        work_content_detail,
        notes
      } = req.body;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new BadRequestError("Please complete your freelancer profile before creating work logs", []);
      }

      const project = await ProjectRequirement.findById(project_requirement_id);
      if (!project) {
        throw new BadRequestError("Project not found", []);
      }

      if (project.status !== "进行中" && project.status !== "发布") {
        throw new BadRequestError(
          `Cannot create work log for project with status: ${project.status}. Only 进行中 or 发布 projects can have work logs.`,
          []
        );
      }

      const workDateObj = new Date(work_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (workDateObj > today) {
        throw new BadRequestError(
          "Work date cannot be in the future",
          []
        );
      }

      if (hours_worked <= 0 || hours_worked > 24) {
        throw new BadRequestError(
          "Hours worked must be between 0 and 24",
          []
        );
      }

      const existingWorkLog = await WorkLog.findOne({
        freelancer_id: freelancerProfile._id,
        project_requirement_id,
        work_date: workDateObj
      });

      if (existingWorkLog) {
        throw new BadRequestError(
          "A work log already exists for this project on the same date",
          []
        );
      }

      const workLog = new WorkLog({
        freelancer_id: freelancerProfile._id,
        project_requirement_id,
        company_id: company_id || project.company_id,
        affiliation_id,
        work_period_start: new Date(work_period_start),
        work_period_end: new Date(work_period_end),
        work_date: workDateObj,
        hours_worked,
        work_type,
        work_description,
        work_content_detail,
        notes,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date()
      });

      await workLog.save();

      res.status(StatusCodes.CREATED).json({
        message: "Work log created successfully",
        work_log: workLog
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const updates = req.body;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new NotFoundError("Freelancer profile not found", []);
      }

      const workLog = await WorkLog.findOne({
        _id: id,
        freelancer_id: freelancerProfile._id
      });

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status !== "draft" && workLog.status !== "rejected") {
        throw new BadRequestError(
          `Cannot update work log with status: ${workLog.status}. Only draft or rejected work logs can be updated.`,
          []
        );
      }

      const allowedUpdates = [
        "work_period_start",
        "work_period_end",
        "work_date",
        "hours_worked",
        "work_type",
        "work_description",
        "work_content_detail",
        "notes"
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          (workLog as any)[field] = updates[field];
        }
      });

      workLog.updated_at = new Date();
      await workLog.save();

      res.status(StatusCodes.OK).json({
        message: "Work log updated successfully",
        work_log: workLog
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new NotFoundError("Freelancer profile not found", []);
      }

      const workLog = await WorkLog.findOne({
        _id: id,
        freelancer_id: freelancerProfile._id
      });

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status !== "draft") {
        throw new BadRequestError(
          `Cannot delete work log with status: ${workLog.status}. Only draft work logs can be deleted.`,
          []
        );
      }

      await WorkLog.findByIdAndDelete(id);

      res.status(StatusCodes.OK).json({
        message: "Work log deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  public static async submitWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new NotFoundError("Freelancer profile not found", []);
      }

      const workLog = await WorkLog.findOne({
        _id: id,
        freelancer_id: freelancerProfile._id
      });

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status !== "draft" && workLog.status !== "rejected") {
        throw new BadRequestError(
          `Cannot submit work log with status: ${workLog.status}. Only draft or rejected work logs can be submitted.`,
          []
        );
      }

      workLog.status = "submitted";
      workLog.submitted_at = new Date();
      workLog.updated_at = new Date();
      await workLog.save();

      if (workLog.company_id) {
        NotificationHelper.sendWorkLogSubmittedNotification(
          user._id.toString(),
          workLog.company_id.toString(),
          workLog._id.toString(),
          workLog.hours_worked
        ).catch(err => console.error('Failed to send notification:', err));
      }

      res.status(StatusCodes.OK).json({
        message: "Work log submitted successfully",
        work_log: workLog
      });
    } catch (error) {
      next(error);
    }
  }

  public static async withdrawWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new NotFoundError("Freelancer profile not found", []);
      }

      const workLog = await WorkLog.findOne({
        _id: id,
        freelancer_id: freelancerProfile._id
      });

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status === "invoiced") {
        throw new BadRequestError(
          "Cannot withdraw work log that has been invoiced. Please contact HR to handle this.",
          []
        );
      }

      if (workLog.status === "paid") {
        throw new BadRequestError(
          "Cannot withdraw work log that has been paid. Payment has already been processed.",
          []
        );
      }

      if (workLog.status === "confirmed") {
        throw new BadRequestError(
          "Cannot withdraw work log that has been confirmed. Please contact HR if changes are needed.",
          []
        );
      }

      if (workLog.status !== "submitted") {
        throw new BadRequestError(
          `Cannot withdraw work log with status: ${workLog.status}. Only submitted work logs can be withdrawn.`,
          []
        );
      }

      workLog.status = "draft";
      workLog.submitted_at = undefined;
      workLog.updated_at = new Date();
      await workLog.save();

      res.status(StatusCodes.OK).json({
        message: "Work log withdrawn successfully. It has been returned to draft status.",
        work_log: workLog
      });
    } catch (error) {
      next(error);
    }
  }

  public static async confirmWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const { billing_info } = req.body;

      const workLog = await WorkLog.findById(id);

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status !== "submitted") {
        throw new BadRequestError(
          `Cannot confirm work log with status: ${workLog.status}. Only submitted work logs can be confirmed.`,
          []
        );
      }

      workLog.status = "confirmed";
      workLog.confirmed_at = new Date();
      workLog.confirmed_by = user._id;
      workLog.updated_at = new Date();

      if (billing_info) {
        workLog.billing_info = billing_info;
      }

      await workLog.save();

      NotificationHelper.sendWorkLogConfirmedNotification(
        workLog.freelancer_id.toString(),
        workLog._id.toString(),
        workLog.hours_worked
      ).catch(err => console.error('Failed to send notification:', err));

      res.status(StatusCodes.OK).json({
        message: "Work log confirmed successfully",
        work_log: workLog
      });
    } catch (error) {
      next(error);
    }
  }

  public static async rejectWorkLog(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const { rejection_reason } = req.body;

      if (!rejection_reason) {
        throw new BadRequestError("Rejection reason is required", []);
      }

      const workLog = await WorkLog.findById(id);

      if (!workLog) {
        throw new NotFoundError("Work log not found", []);
      }

      if (workLog.status !== "submitted") {
        throw new BadRequestError(
          `Cannot reject work log with status: ${workLog.status}. Only submitted work logs can be rejected.`,
          []
        );
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
      ).catch(err => console.error('Failed to send notification:', err));

      res.status(StatusCodes.OK).json({
        message: "Work log rejected",
        work_log: workLog
      });
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

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        throw new BadRequestError("Freelancer profile not found", []);
      }

      const workLogs = await WorkLog.find({
        _id: { $in: work_log_ids },
        freelancer_id: freelancerProfile._id,
        status: { $in: ["draft", "rejected"] }
      });

      if (workLogs.length !== work_log_ids.length) {
        throw new BadRequestError(
          "Some work logs not found or cannot be submitted",
          []
        );
      }

      const now = new Date();
      await WorkLog.updateMany(
        { _id: { $in: work_log_ids } },
        {
          $set: {
            status: "submitted",
            submitted_at: now,
            updated_at: now
          }
        }
      );

      res.status(StatusCodes.OK).json({
        message: `${workLogs.length} work logs submitted successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  public static async batchConfirmWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { work_log_ids, billing_info } = req.body;

      if (!Array.isArray(work_log_ids) || work_log_ids.length === 0) {
        throw new BadRequestError("work_log_ids array is required", []);
      }

      const workLogs = await WorkLog.find({
        _id: { $in: work_log_ids },
        status: "submitted"
      });

      if (workLogs.length !== work_log_ids.length) {
        throw new BadRequestError(
          "Some work logs not found or are not in submitted status",
          []
        );
      }

      const now = new Date();
      const updateData: any = {
        status: "confirmed",
        confirmed_at: now,
        confirmed_by: user._id,
        updated_at: now
      };

      if (billing_info) {
        updateData.billing_info = billing_info;
      }

      await WorkLog.updateMany(
        { _id: { $in: work_log_ids } },
        { $set: updateData }
      );

      res.status(StatusCodes.OK).json({
        message: `${workLogs.length} work logs confirmed successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkLogSummary(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { project_id, period_start, period_end } = req.query;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({ 
          total_hours: 0, 
          total_logs: 0, 
          by_status: [],
          status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0, invoiced: 0, paid: 0 }
        });
      }

      const matchQuery: any = {
        freelancer_id: freelancerProfile._id,
      };

      if (project_id) {
        matchQuery.project_requirement_id = project_id;
      }

      if (period_start || period_end) {
        matchQuery.work_date = {};
        if (period_start) {
          matchQuery.work_date.$gte = new Date(period_start as string);
        }
        if (period_end) {
          matchQuery.work_date.$lte = new Date(period_end as string);
        }
      }

      const summary = await WorkLog.aggregate([
        { $match: matchQuery },
        { $group: {
          _id: null,
          total_hours: { $sum: "$hours_worked" },
          total_logs: { $sum: 1 },
          by_status: {
            $push: {
              status: "$status",
              hours: "$hours_worked"
            }
          }
        }},
        { $project: {
          _id: 0,
          total_hours: 1,
          total_logs: 1,
          by_status: 1
        }}
      ]);

      const statusCounts = await WorkLog.aggregate([
        { $match: matchQuery },
        { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }}
      ]);

      const statusCountMap: Record<string, number> = {
        draft: 0,
        submitted: 0,
        confirmed: 0,
        rejected: 0,
        invoiced: 0,
        paid: 0
      };

      statusCounts.forEach((item: any) => {
        if (statusCountMap.hasOwnProperty(item._id)) {
          statusCountMap[item._id] = item.count;
        }
      });

      const result = summary[0] || { total_hours: 0, total_logs: 0, by_status: [] };
      (result as any).status_counts = statusCountMap;

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getPendingWorkLogsForCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { page = "1", limit = "10", project_id } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const userAccount = await UserAccount.findById(user._id);
      if (!userAccount?.company_id) {
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: {
            current_page: pageNum,
            total_pages: 0,
            total_items: 0,
            items_per_page: limitNum
          }
        });
      }

      const query: any = {
        status: "submitted",
        company_id: userAccount.company_id
      };

      if (project_id) {
        query.project_requirement_id = project_id;
      }

      const workLogs = await WorkLog.find(query)
        .populate("freelancer_id", "display_name email")
        .populate("project_requirement_id", "project_title")
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await WorkLog.countDocuments(query);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHRWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      console.log(`[getHRWorkLogs] User ID: ${user._id}`);
      
      const userAccount = await UserAccount.findById(user._id);
      console.log(`[getHRWorkLogs] User company_id: ${userAccount?.company_id}`);
      
      if (!userAccount?.company_id) {
        console.log(`[getHRWorkLogs] User has no company_id, returning empty array`);
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: {
            current_page: page,
            total_pages: 0,
            total_items: 0,
            items_per_page: limit
          }
        });
      }

      const projectRequirements = await ProjectRequirement.find({ 
        company_id: userAccount.company_id 
      }).select('_id');
      const projectIds = projectRequirements.map((p: any) => p._id);
      console.log(`[getHRWorkLogs] Project count: ${projectIds.length}, IDs: ${projectIds}`);

      if (projectIds.length === 0) {
        console.log(`[getHRWorkLogs] No projects found, returning empty array`);
        return res.status(StatusCodes.OK).json({
          work_logs: [],
          pagination: {
            current_page: page,
            total_pages: 0,
            total_items: 0,
            items_per_page: limit
          }
        });
      }

      const query: any = { project_requirement_id: { $in: projectIds } };
      if (status) {
        query.status = status;
      }
      console.log(`[getHRWorkLogs] Query: ${JSON.stringify(query)}`);

      const workLogs = await WorkLog.find(query)
        .populate("freelancer_id", "display_name email")
        .populate({
          path: "project_requirement_id",
          select: "project_title job_title",
          populate: { path: "company_id", select: "company_name" }
        })
        .sort({ work_date: -1, created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await WorkLog.countDocuments(query);

      res.status(StatusCodes.OK).json({
        work_logs: workLogs,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAvailableProjects(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({
          projects: [],
        });
      }

      const JobPostActivity = mongoose.model('JobPostActivity');
      const acceptedApplications = await JobPostActivity.find({
        user_account_id: user._id,
        status: 'accepted'
      }).select('job_post_id');

      const jobPostIds = acceptedApplications.map((app: any) => app.job_post_id);

      const JobPost = mongoose.model('JobPost');
      const jobPosts = await JobPost.find({
        _id: { $in: jobPostIds },
        status: { $in: ['published', 'in_progress'] },
        is_active: true
      })
        .populate("company_id", "company_name")
        .populate("job_location_id")
        .sort({ created_date: -1 });

      res.status(StatusCodes.OK).json({
        projects: jobPosts,
      });
    } catch (error) {
      next(error);
    }
  }
}
