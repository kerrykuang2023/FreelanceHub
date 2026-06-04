import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
      from: process.env.SMTP_FROM || "noreply@freelancehub.com",
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (this.config.auth.user && this.config.auth.pass) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
      });
    }
  }

  public async sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      console.warn("Email service not configured. Email would have been sent:", data);
      return { success: false, error: "Email service not configured" };
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.config.from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        attachments: data.attachments,
      });

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  }

  public async sendProjectApplicationNotification(
    to: string,
    data: { applicantName: string; projectName: string; applicationId: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("project-application", {
      applicantName: data.applicantName,
      projectName: data.projectName,
      applicationUrl: `${process.env.FRONTEND_URL}/applications/${data.applicationId}`,
    });

    const result = await this.sendEmail({
      to,
      subject: `New Application for ${data.projectName}`,
      html,
    });

    return { success: result.success };
  }

  public async sendApplicationResultNotification(
    to: string,
    data: { projectName: string; status: "approved" | "rejected"; reason?: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("application-result", {
      projectName: data.projectName,
      status: data.status,
      reason: data.reason,
    });

    const result = await this.sendEmail({
      to,
      subject: `Application ${data.status === "approved" ? "Approved" : "Rejected"} - ${data.projectName}`,
      html,
    });

    return { success: result.success };
  }

  public async sendWorkLogConfirmationNotification(
    to: string,
    data: { projectName: string; hours: number; date: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("worklog-confirmation", {
      projectName: data.projectName,
      hours: data.hours,
      date: data.date,
    });

    const result = await this.sendEmail({
      to,
      subject: `Work Log Confirmed - ${data.projectName}`,
      html,
    });

    return { success: result.success };
  }

  public async sendInvoiceNotification(
    to: string,
    data: { invoiceNumber: string; amount: number; currency: string; status: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("invoice-notification", {
      invoiceNumber: data.invoiceNumber,
      amount: data.amount.toFixed(2),
      currency: data.currency,
      status: data.status,
    });

    const result = await this.sendEmail({
      to,
      subject: `Invoice ${data.invoiceNumber} - ${data.status}`,
      html,
    });

    return { success: result.success };
  }

  public async sendPaymentConfirmationNotification(
    to: string,
    data: { invoiceNumber: string; amount: number; currency: string; paymentDate: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("payment-confirmation", {
      invoiceNumber: data.invoiceNumber,
      amount: data.amount.toFixed(2),
      currency: data.currency,
      paymentDate: data.paymentDate,
    });

    const result = await this.sendEmail({
      to,
      subject: `Payment Received - Invoice ${data.invoiceNumber}`,
      html,
    });

    return { success: result.success };
  }

  public async sendWelcomeEmail(to: string, data: { name: string }): Promise<{ success: boolean }> {
    const html = this.getTemplate("welcome", {
      name: data.name,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    });

    const result = await this.sendEmail({
      to,
      subject: "Welcome to FreelanceHub",
      html,
    });

    return { success: result.success };
  }

  public async sendPasswordResetEmail(
    to: string,
    data: { name: string; resetToken: string }
  ): Promise<{ success: boolean }> {
    const html = this.getTemplate("password-reset", {
      name: data.name,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}`,
    });

    const result = await this.sendEmail({
      to,
      subject: "Password Reset Request",
      html,
    });

    return { success: result.success };
  }

  private getTemplate(templateName: string, data: Record<string, any>): string {
    const templates: Record<string, (data: Record<string, any>) => string> = {
      "project-application": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Project Application</h2>
          <p>Hello,</p>
          <p><strong>${d.applicantName}</strong> has applied to your project <strong>${d.projectName}</strong>.</p>
          <p>Please review the application at your earliest convenience.</p>
          <p><a href="${d.applicationUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Application</a></p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "application-result": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application ${d.status === "approved" ? "Approved" : "Rejected"}</h2>
          <p>Hello,</p>
          <p>Your application for <strong>${d.projectName}</strong> has been <strong>${d.status}</strong>.</p>
          ${d.reason ? `<p>Reason: ${d.reason}</p>` : ""}
          ${d.status === "approved" ? "<p>You can now start working on this project and submit work logs.</p>" : ""}
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "worklog-confirmation": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Work Log Confirmed</h2>
          <p>Hello,</p>
          <p>Your work log for <strong>${d.projectName}</strong> has been confirmed.</p>
          <ul>
            <li>Date: ${d.date}</li>
            <li>Hours: ${d.hours}</li>
          </ul>
          <p>You can now include this work log in your invoice.</p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "invoice-notification": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice ${d.status}</h2>
          <p>Hello,</p>
          <p>Invoice <strong>${d.invoiceNumber}</strong> has been ${d.status}.</p>
          <p>Amount: ${d.currency} ${d.amount}</p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "payment-confirmation": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Received</h2>
          <p>Hello,</p>
          <p>We're pleased to inform you that payment has been received for invoice <strong>${d.invoiceNumber}</strong>.</p>
          <ul>
            <li>Amount: ${d.currency} ${d.amount}</li>
            <li>Payment Date: ${d.paymentDate}</li>
          </ul>
          <p>Thank you for your work!</p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "welcome": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to FreelanceHub!</h2>
          <p>Hello ${d.name},</p>
          <p>Thank you for registering with FreelanceHub. We're excited to have you on board!</p>
          <p>You can now:</p>
          <ul>
            <li>Create your professional profile</li>
            <li>Browse available projects</li>
            <li>Apply for opportunities that match your skills</li>
          </ul>
          <p><a href="${d.loginUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
      "password-reset": (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${d.name},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p><a href="${d.resetUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>FreelanceHub Team</p>
        </div>
      `,
    };

    return templates[templateName]?.(data) || "";
  }
}

export default new EmailService();
