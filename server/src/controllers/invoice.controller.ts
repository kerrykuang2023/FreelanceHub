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
  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user?._id || user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      let userRole = user?.role;
      if (!userRole && user?.user_type_id) {
        userRole = typeof user.user_type_id === 'object' 
          ? user.user_type_id.user_type_name 
          : null;
      }
      userRole = userRole?.toLowerCase().replace(/[_\s]/g, '_');

      const query: any = {};

      if (userRole === "job_seeker" || userRole === "freelancer") {
        const profile = await FreelancerProfile.findOne({ user_id: userId });
        if (profile) {
          query.freelancer_id = profile._id;
        }
      } else if (userRole === "hr_recruiter" || userRole === "company") {
        const userAccount = await UserAccount.findById(userId);
        if (userAccount?.company_id) {
          query.company_id = userAccount.company_id;
        } else {
          const company = await Company.findOne({ created_by: userId });
          if (company) {
            query.company_id = company._id;
          }
        }
      }

      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [invoices, total] = await Promise.all([
        FreelancerInvoice.find(query)
          .populate("freelancer_id", "freelancer_name user_id")
          .populate({
            path: "freelancer_id",
            populate: { path: "user_id", select: "user_name email" }
          })
          .populate("company_id", "company_name")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerInvoice.countDocuments(query),
      ]);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invoice = await FreelancerInvoice.findById(id)
        .populate("freelancer_id")
        .populate({
          path: "freelancer_id",
          populate: { path: "user_id", select: "user_name email" }
        })
        .populate("company_id", "company_name")
        .populate("project_requirement_id", "project_title");

      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      res.json({ invoice });
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const profile = await FreelancerProfile.findOne({ user_id: userId });

      if (!profile) {
        throw new BadRequestError("Freelancer profile not found", []);
      }

      const { work_log_ids, items } = req.body;

      if (work_log_ids && Array.isArray(work_log_ids) && work_log_ids.length > 0) {
        const workLogs = await WorkLog.find({
          _id: { $in: work_log_ids },
          freelancer_id: profile._id,
          status: "confirmed"
        });

        if (workLogs.length !== work_log_ids.length) {
          throw new BadRequestError(
            "Some work logs not found, not confirmed, or do not belong to you",
            []
          );
        }

        const invoicedWorkLogs = await WorkLog.find({
          _id: { $in: work_log_ids },
          invoice_id: { $exists: true, $ne: null }
        });

        if (invoicedWorkLogs.length > 0) {
          throw new BadRequestError(
            "Some work logs have already been invoiced",
            []
          );
        }
      }

      const invoiceData = {
        ...req.body,
        freelancer_id: profile._id,
        invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const invoice = new FreelancerInvoice(invoiceData);
      await invoice.save();

      res.status(StatusCodes.CREATED).json({ invoice });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "draft" && invoice.status !== "rejected") {
        throw new BadRequestError(
          `Cannot update invoice with status: ${invoice.status}. Only draft or rejected invoices can be updated.`,
          []
        );
      }

      const updates = {
        ...req.body,
        updated_at: new Date(),
      };

      delete updates.status;
      delete updates.invoice_number;

      const updatedInvoice = await FreelancerInvoice.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ invoice: updatedInvoice });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "draft") {
        throw new BadRequestError(
          `Cannot delete invoice with status: ${invoice.status}. Only draft invoices can be deleted.`,
          []
        );
      }

      await FreelancerInvoice.findByIdAndDelete(id);

      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async submitInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "draft" && invoice.status !== "rejected") {
        throw new BadRequestError(
          `Cannot submit invoice with status: ${invoice.status}. Only draft or rejected invoices can be submitted.`,
          []
        );
      }

      const workLogIds = (invoice as any).work_log_ids;
      if (workLogIds && Array.isArray(workLogIds) && workLogIds.length > 0) {
        await WorkLog.updateMany(
          { _id: { $in: workLogIds } },
          { 
            $set: { 
              status: "invoiced", 
              invoice_id: invoice._id,
              updated_at: new Date() 
            } 
          }
        );
      }

      invoice.status = "submitted";
      invoice.issued_date = new Date();
      invoice.updated_at = new Date();
      await invoice.save();

      const populatedInvoice = await FreelancerInvoice.findById(id).populate("company_id");

      if (populatedInvoice?.company_id) {
        const companyId = (populatedInvoice.company_id as any)._id || populatedInvoice.company_id;
        NotificationHelper.sendInvoiceSubmittedNotification(
          companyId.toString(),
          populatedInvoice._id.toString(),
          populatedInvoice.total_amount || 0
        ).catch(err => console.error('Failed to send notification:', err));
      }

      res.json({ invoice: populatedInvoice });
    } catch (error) {
      next(error);
    }
  }

  static async approveInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userId = user?._id || user?.id;

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "submitted") {
        throw new BadRequestError(
          `Cannot approve invoice with status: ${invoice.status}. Only submitted invoices can be approved.`,
          []
        );
      }

      let userRole = user?.role;
      if (!userRole && user?.user_type_id) {
        userRole = typeof user.user_type_id === 'object' 
          ? user.user_type_id.user_type_name 
          : null;
      }
      userRole = userRole?.toLowerCase().replace(/[_\s]/g, '_');

      if (userRole === "hr_recruiter" || userRole === "company") {
        const userAccount = await UserAccount.findById(userId);
        if (!userAccount?.company_id || 
            userAccount.company_id.toString() !== invoice.company_id?.toString()) {
          throw new BadRequestError(
            "You do not have permission to approve this invoice",
            []
          );
        }
      }

      (invoice as any).status = "approved";
      (invoice as any).approved_by = userId;
      (invoice as any).approved_at = new Date();
      invoice.updated_at = new Date();
      await invoice.save();

      const populatedInvoice = await FreelancerInvoice.findById(id).populate("freelancer_id");

      if (populatedInvoice?.freelancer_id) {
        const freelancerId = (populatedInvoice.freelancer_id as any)._id || populatedInvoice.freelancer_id;
        NotificationHelper.sendInvoiceApprovedNotification(
          freelancerId.toString(),
          populatedInvoice._id.toString(),
          populatedInvoice.total_amount || 0
        ).catch(err => console.error('Failed to send notification:', err));
      }

      res.json({ invoice: populatedInvoice, message: "Invoice approved successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async rejectInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new BadRequestError("Rejection reason is required", []);
      }

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "submitted") {
        throw new BadRequestError(
          `Cannot reject invoice with status: ${invoice.status}. Only submitted invoices can be rejected.`,
          []
        );
      }

      (invoice as any).status = "rejected";
      (invoice as any).rejection_reason = reason;
      (invoice as any).rejected_at = new Date();
      invoice.updated_at = new Date();
      await invoice.save();

      res.json({ invoice, message: "Invoice rejected" });
    } catch (error) {
      next(error);
    }
  }

  static async markAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { payment_method, payment_reference } = req.body;
      const userId = (req as any).user?._id || (req as any).user?.id;

      const invoice = await FreelancerInvoice.findById(id);
      if (!invoice) {
        throw new NotFoundError("Invoice not found", []);
      }

      if (invoice.status !== "approved") {
        throw new BadRequestError(
          `Cannot mark invoice as paid with status: ${invoice.status}. Only approved invoices can be marked as paid.`,
          []
        );
      }

      (invoice as any).status = "paid";
      (invoice as any).paid_date = new Date();
      (invoice as any).payment_method = payment_method;
      (invoice as any).payment_reference = payment_reference;
      (invoice as any).paid_by = userId;
      invoice.updated_at = new Date();
      await invoice.save();

      const workLogIds = (invoice as any).work_log_ids;
      if (workLogIds && Array.isArray(workLogIds)) {
        await WorkLog.updateMany(
          { _id: { $in: workLogIds } },
          { $set: { status: "paid", updated_at: new Date() } }
        );
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
        return res.json({
          invoices: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        });
      }

      const query: any = { company_id: userAccount.company_id };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [invoices, total] = await Promise.all([
        FreelancerInvoice.find(query)
          .populate({
            path: "freelancer_id",
            populate: { path: "user_id", select: "user_name email" }
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerInvoice.countDocuments(query),
      ]);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async calculateTax(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtotal, tax_rate, tax_mode } = req.body;

      let tax_amount = 0;
      let total_amount = 0;
      let subtotal_amount = subtotal;

      if (tax_mode === "含税价" || tax_mode === "inclusive") {
        total_amount = subtotal;
        subtotal_amount = subtotal / (1 + tax_rate / 100);
        tax_amount = total_amount - subtotal_amount;
      } else {
        tax_amount = subtotal * (tax_rate / 100);
        total_amount = subtotal + tax_amount;
      }

      res.json({
        subtotal_amount: Math.round(subtotal_amount * 100) / 100,
        tax_rate,
        tax_amount: Math.round(tax_amount * 100) / 100,
        total_amount: Math.round(total_amount * 100) / 100,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableWorkLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const profile = await FreelancerProfile.findOne({ user_id: userId });

      if (!profile) {
        throw new BadRequestError("Freelancer profile not found", []);
      }

      const workLogs = await WorkLog.find({
        freelancer_id: profile._id,
        status: "confirmed",
        $or: [
          { invoice_id: { $exists: false } },
          { invoice_id: null }
        ]
      })
        .populate("project_requirement_id", "project_title")
        .sort({ work_date: -1 });

      res.json({ work_logs: workLogs });
    } catch (error) {
      next(error);
    }
  }
}
