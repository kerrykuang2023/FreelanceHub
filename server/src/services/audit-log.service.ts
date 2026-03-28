import { Request } from "express";
import AuditLog from "../models/audit/audit-log.model";

interface LogData {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  details?: any;
  status?: "success" | "failed";
  errorMessage?: string;
  durationMs?: number;
}

class AuditLogService {
  public static async log(req: Request, data: LogData): Promise<void> {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      await AuditLog.create({
        user_id: data.userId,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        description: data.description,
        details: data.details,
        ip_address: ip,
        user_agent: req.headers["user-agent"],
        status: data.status || "success",
        error_message: data.errorMessage,
        duration_ms: data.durationMs,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  public static async logLogin(
    req: Request,
    userId: string,
    status: "success" | "failed",
    errorMessage?: string
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: status === "success" ? "login" : "other",
      resourceType: "user",
      resourceId: userId,
      description: status === "success" ? "User logged in successfully" : "Login attempt failed",
      status,
      errorMessage,
    });
  }

  public static async logLogout(req: Request, userId: string): Promise<void> {
    await this.log(req, {
      userId,
      action: "logout",
      resourceType: "user",
      resourceId: userId,
      description: "User logged out",
    });
  }

  public static async logCreate(
    req: Request,
    userId: string,
    resourceType: string,
    resourceId: string,
    description: string,
    details?: any
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "create",
      resourceType,
      resourceId,
      description,
      details,
    });
  }

  public static async logUpdate(
    req: Request,
    userId: string,
    resourceType: string,
    resourceId: string,
    description: string,
    details?: any
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "update",
      resourceType,
      resourceId,
      description,
      details,
    });
  }

  public static async logDelete(
    req: Request,
    userId: string,
    resourceType: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "delete",
      resourceType,
      resourceId,
      description,
    });
  }

  public static async logApprove(
    req: Request,
    userId: string,
    resourceType: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "approve",
      resourceType,
      resourceId,
      description,
    });
  }

  public static async logReject(
    req: Request,
    userId: string,
    resourceType: string,
    resourceId: string,
    description: string,
    reason?: string
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "reject",
      resourceType,
      resourceId,
      description,
      details: { reason },
    });
  }

  public static async logExport(
    req: Request,
    userId: string,
    resourceType: string,
    description: string,
    details?: any
  ): Promise<void> {
    await this.log(req, {
      userId,
      action: "export",
      resourceType,
      description,
      details,
    });
  }

  public static async getLogsByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { user_id: userId };

    if (options.action) {
      query.action = options.action;
    }

    if (options.resourceType) {
      query.resource_type = options.resourceType;
    }

    if (options.startDate || options.endDate) {
      query.created_at = {};
      if (options.startDate) {
        query.created_at.$gte = options.startDate;
      }
      if (options.endDate) {
        query.created_at.$lte = options.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getLogsByResource(
    resourceType: string,
    resourceId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({
        resource_type: resourceType,
        resource_id: resourceId,
      })
        .populate("user_id", "email user_name")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({
        resource_type: resourceType,
        resource_id: resourceId,
      }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getRecentActivity(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    return AuditLog.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit);
  }

  public static async getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    byStatus: { success: number; failed: number };
  }> {
    const logs = await AuditLog.find({
      created_at: { $gte: startDate, $lte: endDate },
    });

    const byAction: Record<string, number> = {};
    const byResourceType: Record<string, number> = {};
    let success = 0;
    let failed = 0;

    logs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byResourceType[log.resource_type] = (byResourceType[log.resource_type] || 0) + 1;
      if (log.status === "success") {
        success++;
      } else {
        failed++;
      }
    });

    return {
      totalActions: logs.length,
      byAction,
      byResourceType,
      byStatus: { success, failed },
    };
  }
}

export default AuditLogService;
