import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    type: {
      type: String,
      enum: ["system", "application", "worklog", "invoice", "payment", "message", "project"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "notifications",
  }
);

NotificationSchema.index({ user_id: 1, is_read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });

let Notification: mongoose.Model<any>;

try {
  Notification = mongoose.model("Notification");
} catch {
  Notification = mongoose.model("Notification", NotificationSchema);
}

export class NotificationHelper {
  static async sendNotification(data: {
    user_id: string;
    type: "system" | "application" | "worklog" | "invoice" | "payment" | "message" | "project";
    title: string;
    content: string;
    link?: string;
    metadata?: any;
  }) {
    const notification = new Notification({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
      metadata: data.metadata,
      created_at: new Date(),
    });

    await notification.save();
    return notification;
  }

  static async sendWorkLogSubmittedNotification(freelancerId: string, companyId: string, workLogId: string, hoursWorked: number) {
    await this.sendNotification({
      user_id: companyId,
      type: "worklog",
      title: "新的工时提交",
      content: `顾问提交了 ${hoursWorked} 小时的工时记录，请及时审核。`,
      link: `/work-logs/${workLogId}`,
      metadata: { work_log_id: workLogId, freelancer_id: freelancerId },
    });
  }

  static async sendWorkLogConfirmedNotification(freelancerId: string, workLogId: string, hoursWorked: number) {
    await this.sendNotification({
      user_id: freelancerId,
      type: "worklog",
      title: "工时已确认",
      content: `您提交的 ${hoursWorked} 小时工时记录已被确认。`,
      link: `/work-logs/${workLogId}`,
      metadata: { work_log_id: workLogId },
    });
  }

  static async sendWorkLogRejectedNotification(freelancerId: string, workLogId: string, reason: string) {
    await this.sendNotification({
      user_id: freelancerId,
      type: "worklog",
      title: "工时被驳回",
      content: `您的工时记录被驳回，原因：${reason}`,
      link: `/work-logs/${workLogId}`,
      metadata: { work_log_id: workLogId },
    });
  }

  static async sendInvoiceSubmittedNotification(companyId: string, invoiceId: string, totalAmount: number) {
    await this.sendNotification({
      user_id: companyId,
      type: "invoice",
      title: "新发票待审核",
      content: `收到新发票，金额：¥${totalAmount.toFixed(2)}，请及时处理。`,
      link: `/invoices/${invoiceId}`,
      metadata: { invoice_id: invoiceId },
    });
  }

  static async sendInvoiceApprovedNotification(freelancerId: string, invoiceId: string, totalAmount: number) {
    await this.sendNotification({
      user_id: freelancerId,
      type: "invoice",
      title: "发票已通过",
      content: `您的发票（¥${totalAmount.toFixed(2)}）已审核通过。`,
      link: `/invoices/${invoiceId}`,
      metadata: { invoice_id: invoiceId },
    });
  }

  static async sendPaymentReceivedNotification(freelancerId: string, paymentId: string, amount: number) {
    await this.sendNotification({
      user_id: freelancerId,
      type: "payment",
      title: "收到付款",
      content: `您收到一笔付款，金额：¥${amount.toFixed(2)}`,
      link: `/payments/${paymentId}`,
      metadata: { payment_id: paymentId },
    });
  }

  static async sendProjectApplicationNotification(companyId: string, applicationId: string, projectName: string) {
    await this.sendNotification({
      user_id: companyId,
      type: "application",
      title: "收到项目申请",
      content: `有顾问申请了您的项目「${projectName}」。`,
      link: `/applications/${applicationId}`,
      metadata: { application_id: applicationId },
    });
  }

  static async sendJobApplicationNotification(hrUserId: string, applicationId: string, jobTitle: string) {
    await this.sendNotification({
      user_id: hrUserId,
      type: "application",
      title: "收到职位申请",
      content: `有顾问申请了您发布的职位「${jobTitle}」。`,
      link: `/applications/${applicationId}`,
      metadata: { application_id: applicationId },
    });
  }

  static async sendApplicationStatusNotification(freelancerId: string, applicationId: string, status: string, positionName: string) {
    const statusText = status === "accepted" ? "已通过" : status === "rejected" ? "已拒绝" : status;
    await this.sendNotification({
      user_id: freelancerId,
      type: "application",
      title: `申请${statusText}`,
      content: `您对「${positionName}」的申请${statusText}。`,
      link: `/applications/${applicationId}`,
      metadata: { application_id: applicationId, status },
    });
  }

  static async sendProjectStatusNotification(userId: string, projectId: string, projectName: string, status: string) {
    const statusMap: Record<string, string> = {
      published: "已发布",
      in_progress: "已开始",
      completed: "已完成",
      cancelled: "已取消",
    };
    await this.sendNotification({
      user_id: userId,
      type: "project",
      title: "项目状态更新",
      content: `项目「${projectName}」状态更新为：${statusMap[status] || status}`,
      link: `/jobs/${projectId}`,
      metadata: { project_id: projectId, status },
    });
  }

  static async sendProjectPublishedNotification(userId: string, projectId: string, projectName: string) {
    await this.sendNotification({
      user_id: userId,
      type: "project",
      title: "新项目发布",
      content: `有一个新的项目「${projectName}」与您的技能匹配，快来看看吧！`,
      link: `/jobs/${projectId}`,
      metadata: { project_id: projectId, status: "published" },
    });
  }

  static async sendProjectClosedNotification(userId: string, projectId: string, projectName: string) {
    await this.sendNotification({
      user_id: userId,
      type: "project",
      title: "项目已关闭",
      content: `您参与的项目「${projectName}」已关闭。`,
      link: `/jobs/${projectId}`,
      metadata: { project_id: projectId, status: "closed" },
    });
  }
}

export default NotificationHelper;
