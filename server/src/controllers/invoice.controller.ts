import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import FreelancerInvoice from "../models/freelancer/freelancer_invoice.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import Company from "../models/company-profile/company.model";
import UserAccount from "../models/user/user-account.model";
import WorkLog from "../models/freelancer/work_log.model";
import NotificationHelper from "../services/notification-helper.service";
import { BadRequestError, NotFoundError } from "../errors";

export default class InvoiceController {
  private static getUserRole(user: any) {
    return (user?.role || user?.user_type_id?.user_type_name || "").toLowerCase().replace(/[_\s]/g, "_");
  }

  private static async getFreelancerProfileForUser(userId: any) {
    return FreelancerProfile.findOne({ user_id: userId });
  }

  private static async assertCanAccessInvoice(user: any, invoice: any, action: "read" | "write" | "company") {
    const userId = user?._id || user?.id;
    const role = InvoiceController.getUserRole(user);
    if (role === "admin") return;

    if (action !== "company") {
      const profile = await InvoiceController.getFreelancerProfileForUser(userId);
      if (profile && invoice.freelancer_id?.toString() === profile._id.toString()) return;
    }

    if (role === "hr_recruiter" || role === "company") {
      const userAccount = await UserAccount.findById(userId);
      if (userAccount?.company_id && userAccount.company_id.toString() === invoice.company_id?.toString()) return;
    }

    throw new BadRequestError("You do not have permission to access this invoice", []);
  }

  private static money(value: unknown) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  private static getWorkLogBillableTotal(workLogs: any[]) {
    return InvoiceController.money(
      workLogs.reduce((total, workLog) => total + Number(workLog.billing_info?.total_amount ?? workLog.billing_info?.amount ?? 0), 0)
    );
  }

  private static async validateWorkLogsForInvoice(profileId: any, workLogIds: any[], expectedTotal?: unknown) {
    const workLogs = await WorkLog.find({ _id: { $in: workLogIds }, freelancer_id: profileId, status: "confirmed" });
    if (workLogs.length !== workLogIds.length) {
      throw new BadRequestError("Some work logs not found, not confirmed, or do not belong to you", []);
    }

    const invoicedWorkLogs = await WorkLog.find({
      _id: { $in: workLogIds },
      invoice_id: { $exists: true, $ne: null },
    });
    if (invoicedWorkLogs.length > 0) throw new BadRequestError("Some work logs have already been invoiced", []);

    const companyIds = new Set(workLogs.map((workLog: any) => workLog.company_id?.toString()).filter(Boolean));
    if (companyIds.size !== 1) {
      throw new BadRequestError("Work logs from different companies cannot be billed in one invoice", []);
    }

    if (expectedTotal !== undefined) {
      const expected = InvoiceController.getWorkLogBillableTotal(workLogs);
      const submitted = InvoiceController.money(expectedTotal);
      if (Math.abs(expected - submitted) > 0.01) {
        throw new BadRequestError(`Invoice total does not match confirmed work logs. Expected ${expected}, got ${submitted}`, []);
      }
    }

    return workLogs;
  }

  private static normalizeInvoiceType(value: unknown): string {
    const raw = typeof value === "string" ? value : "";
    const map: Record<string, string> = {
      service: "service_fee",
      "服务费发票": "service_fee",
      "增值税专用发票": "vat_special",
      "增值税普通发票": "vat_normal",
      "个人发票": "personal",
    };
    return map[raw] || raw || "service_fee";
  }

  private static normalizeTaxMode(value: unknown): string {
    const raw = typeof value === "string" ? value : "";
    const map: Record<string, string> = {
      "含税价": "inclusive",
      "不含税价": "exclusive",
    };
    return map[raw] || raw || "exclusive";
  }

  private static normalizePaymentMethod(value: unknown): string | undefined {
    if (!value) return undefined;
    const raw = String(value);
    const map: Record<string, string> = {
      "银行转账": "bank_transfer",
      "支付宝": "alipay",
      "微信支付": "wechat",
      "支票": "check",
      cheque: "check",
      "现金": "cash",
      "其他": "other",
    };
    return map[raw] || raw;
  }

  private static normalizeItems(items: any[]) {
    const unitMap: Record<string, string> = {
      "小时": "hour",
      "天": "day",
      "月": "month",
      "项目": "project",
      "次": "time",
    };
    return (items || []).map((item) => ({
      ...item,
      unit: unitMap[item.unit] || item.unit || "hour",
    }));
  }

  private static async getCompanyQueryForUser(user: any) {
    const userId = user?._id || user?.id;
    const userRole = (user?.role || user?.user_type_id?.user_type_name || "").toLowerCase().replace(/[_\s]/g, "_");
    if (userRole === "job_seeker" || userRole === "freelancer") {
      const profile = await FreelancerProfile.findOne({ user_id: userId });
      return profile ? { freelancer_id: profile._id } : { _id: null };
    }

    if (userRole === "hr_recruiter" || userRole === "company") {
      const userAccount = await UserAccount.findById(userId);
      if (userAccount?.company_id) return { company_id: userAccount.company_id };
      const company = await Company.findOne({ created_by: userId });
      if (company) return { company_id: company._id };
      return { _id: null };
    }

    return {};
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const query: any = await InvoiceController.getCompanyQueryForUser((req as any).user);
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [invoices, total] = await Promise.all([
        FreelancerInvoice.find(query)
          .populate({ path: "freelancer_id", populate: { path: "user_id", select: "user_name email" } })
          .populate("company_id", "company_name")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerInvoice.countDocuments(query),
      ]);

      res.json({ invoices, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FreelancerInvoice.findById(req.params.id)
        .populate({ path: "freelancer_id", populate: { path: "user_id", select: "user_name email" } })
        .populate("company_id", "company_name")
        .populate("project_requirement_id", "project_title")
        .populate("work_log_ids");
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "read");
      res.json({ invoice });
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const profile = await FreelancerProfile.findOne({ user_id: userId });
      if (!profile) throw new BadRequestError("Freelancer profile not found", []);

      const { work_log_ids } = req.body;
      let inferredData: any = {};
      if (Array.isArray(work_log_ids) && work_log_ids.length > 0) {
        const workLogs = await InvoiceController.validateWorkLogsForInvoice(profile._id, work_log_ids, req.body.total_amount);
        const projectIds = new Set(workLogs.map((workLog: any) => workLog.project_requirement_id?.toString()).filter(Boolean));

        inferredData = {
          company_id: req.body.company_id || workLogs[0].company_id,
          project_requirement_id: req.body.project_requirement_id || (projectIds.size === 1 ? workLogs[0].project_requirement_id : undefined),
          affiliation_id: req.body.affiliation_id || workLogs[0].affiliation_id,
        };
      }

      const invoice = new FreelancerInvoice({
        ...req.body,
        ...inferredData,
        freelancer_id: profile._id,
        invoice_type: InvoiceController.normalizeInvoiceType(req.body.invoice_type),
        tax_calculation_mode: InvoiceController.normalizeTaxMode(req.body.tax_calculation_mode),
        items: InvoiceController.normalizeItems(req.body.items),
        invoice_number: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
      });
      await invoice.save();

      res.status(StatusCodes.CREATED).json({ invoice });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "write");
      if (!["draft", "rejected"].includes(invoice.status)) {
        throw new BadRequestError(`Cannot update invoice with status: ${invoice.status}.`, []);
      }

      if (req.body.work_log_ids !== undefined) {
        throw new BadRequestError("Work logs linked to an invoice cannot be changed after creation", []);
      }
      if (Array.isArray((invoice as any).work_log_ids) && (invoice as any).work_log_ids.length > 0 && req.body.total_amount !== undefined) {
        const workLogs = await WorkLog.find({ _id: { $in: (invoice as any).work_log_ids }, freelancer_id: invoice.freelancer_id });
        const expected = InvoiceController.getWorkLogBillableTotal(workLogs);
        const submitted = InvoiceController.money(req.body.total_amount);
        if (Math.abs(expected - submitted) > 0.01) {
          throw new BadRequestError(`Invoice total does not match confirmed work logs. Expected ${expected}, got ${submitted}`, []);
        }
      }

      const updates = {
        ...req.body,
        invoice_type: req.body.invoice_type ? InvoiceController.normalizeInvoiceType(req.body.invoice_type) : invoice.invoice_type,
        tax_calculation_mode: req.body.tax_calculation_mode ? InvoiceController.normalizeTaxMode(req.body.tax_calculation_mode) : invoice.tax_calculation_mode,
        items: req.body.items ? InvoiceController.normalizeItems(req.body.items) : invoice.items,
        updated_at: new Date(),
      };
      delete updates.status;
      delete updates.invoice_number;

      const updatedInvoice = await FreelancerInvoice.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      res.json({ invoice: updatedInvoice });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "write");
      if (invoice.status !== "draft") throw new BadRequestError(`Cannot delete invoice with status: ${invoice.status}.`, []);
      await FreelancerInvoice.findByIdAndDelete(req.params.id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async submitInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "write");
      if (!["draft", "rejected"].includes(invoice.status)) {
        throw new BadRequestError(`Cannot submit invoice with status: ${invoice.status}.`, []);
      }

      const workLogIds = (invoice as any).work_log_ids;
      if (Array.isArray(workLogIds) && workLogIds.length > 0) {
        const workLogs = await WorkLog.find({ _id: { $in: workLogIds }, freelancer_id: invoice.freelancer_id, status: "confirmed" });
        if (workLogs.length !== workLogIds.length) {
          throw new BadRequestError("Some linked work logs are not confirmed and cannot be invoiced", []);
        }
        const expected = InvoiceController.getWorkLogBillableTotal(workLogs);
        const submitted = InvoiceController.money(invoice.total_amount);
        if (Math.abs(expected - submitted) > 0.01) {
          throw new BadRequestError(`Invoice total does not match confirmed work logs. Expected ${expected}, got ${submitted}`, []);
        }
        await WorkLog.updateMany(
          { _id: { $in: workLogIds } },
          { $set: { status: "invoiced", invoice_id: invoice._id, updated_at: new Date() } }
        );
      }

      invoice.status = "submitted";
      invoice.issued_date = new Date();
      (invoice as any).rejection_reason = undefined;
      (invoice as any).rejected_at = undefined;
      (invoice as any).rejected_by = undefined;
      invoice.updated_at = new Date();
      await invoice.save();

      const populatedInvoice = await FreelancerInvoice.findById(req.params.id).populate("company_id");
      if (populatedInvoice?.company_id) {
        const companyId = (populatedInvoice.company_id as any)._id || populatedInvoice.company_id;
        NotificationHelper.sendInvoiceSubmittedNotification(
          companyId.toString(),
          populatedInvoice._id.toString(),
          populatedInvoice.total_amount || 0
        ).catch((err) => console.error("Failed to send notification:", err));
      }

      res.json({ invoice: populatedInvoice });
    } catch (error) {
      next(error);
    }
  }

  static async approveInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user?._id || user?.id;
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice(user, invoice, "company");
      if (invoice.status !== "submitted") {
        throw new BadRequestError(`Cannot approve invoice with status: ${invoice.status}.`, []);
      }

      const userRole = InvoiceController.getUserRole(user);
      if (userRole === "hr_recruiter" || userRole === "company") {
        const userAccount = await UserAccount.findById(userId);
        if (!userAccount?.company_id || userAccount.company_id.toString() !== invoice.company_id?.toString()) {
          throw new BadRequestError("You do not have permission to approve this invoice", []);
        }
      }

      (invoice as any).status = "approved";
      (invoice as any).approved_by = userId;
      (invoice as any).approved_at = new Date();
      invoice.updated_at = new Date();
      await invoice.save();

      res.json({ invoice, message: "Invoice approved successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async rejectInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "company");
      if (invoice.status !== "submitted") {
        throw new BadRequestError(`Cannot reject invoice with status: ${invoice.status}.`, []);
      }
      if (!req.body.reason) throw new BadRequestError("Rejection reason is required", []);

      (invoice as any).status = "rejected";
      (invoice as any).rejection_reason = req.body.reason;
      (invoice as any).rejected_by = (req as any).user?._id || (req as any).user?.id;
      (invoice as any).rejected_at = new Date();
      invoice.updated_at = new Date();
      await invoice.save();

      const workLogIds = (invoice as any).work_log_ids;
      if (Array.isArray(workLogIds) && workLogIds.length > 0) {
        await WorkLog.updateMany({ _id: { $in: workLogIds }, invoice_id: invoice._id }, { $set: { status: "confirmed", updated_at: new Date() } });
      }

      res.json({ invoice, message: "Invoice rejected" });
    } catch (error) {
      next(error);
    }
  }

  static async markAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const invoice = await FreelancerInvoice.findById(req.params.id);
      if (!invoice) throw new NotFoundError("Invoice not found", []);
      await InvoiceController.assertCanAccessInvoice((req as any).user, invoice, "company");
      if (invoice.status !== "approved") {
        throw new BadRequestError(`Cannot mark invoice as paid with status: ${invoice.status}.`, []);
      }

      (invoice as any).status = "paid";
      (invoice as any).paid_date = new Date();
      (invoice as any).payment_method = InvoiceController.normalizePaymentMethod(req.body.payment_method);
      (invoice as any).payment_reference = req.body.payment_reference;
      (invoice as any).paid_by = userId;
      invoice.updated_at = new Date();
      await invoice.save();

      const workLogIds = (invoice as any).work_log_ids;
      if (Array.isArray(workLogIds) && workLogIds.length > 0) {
        await WorkLog.updateMany({ _id: { $in: workLogIds } }, { $set: { status: "paid", updated_at: new Date() } });
      }

      res.json({ invoice, message: "Invoice marked as paid successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { status, page = 1, limit = 20 } = req.query;
      const userAccount = await UserAccount.findById(userId);
      if (!userAccount?.company_id) {
        return res.json({ invoices: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
      }

      const query: any = { company_id: userAccount.company_id };
      if (status) query.status = status;
      const skip = (Number(page) - 1) * Number(limit);
      const [invoices, total] = await Promise.all([
        FreelancerInvoice.find(query)
          .populate({ path: "freelancer_id", populate: { path: "user_id", select: "user_name email" } })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerInvoice.countDocuments(query),
      ]);

      res.json({ invoices, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (error) {
      next(error);
    }
  }

  static async calculateTax(req: Request, res: Response, next: NextFunction) {
    try {
      const subtotal = Number(req.body.subtotal || 0);
      const taxRate = Number(req.body.tax_rate || 0);
      const taxMode = InvoiceController.normalizeTaxMode(req.body.tax_mode || req.body.tax_calculation_mode);
      let taxAmount = 0;
      let totalAmount = 0;
      let subtotalAmount = subtotal;

      if (taxMode === "inclusive") {
        totalAmount = subtotal;
        subtotalAmount = subtotal / (1 + taxRate / 100);
        taxAmount = totalAmount - subtotalAmount;
      } else {
        taxAmount = subtotal * (taxRate / 100);
        totalAmount = subtotal + taxAmount;
      }

      res.json({
        subtotal_amount: Math.round(subtotalAmount * 100) / 100,
        tax_rate: taxRate,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableWorkLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const profile = await FreelancerProfile.findOne({ user_id: userId });
      if (!profile) throw new BadRequestError("Freelancer profile not found", []);

      const workLogs = await WorkLog.find({
        freelancer_id: profile._id,
        status: "confirmed",
        $or: [{ invoice_id: { $exists: false } }, { invoice_id: null }],
      })
        .populate("project_requirement_id", "project_title")
        .sort({ work_date: -1 });

      res.json({ work_logs: workLogs });
    } catch (error) {
      next(error);
    }
  }
}
