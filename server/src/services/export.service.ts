import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Response } from "express";
import mongoose from "mongoose";
import WorkLog from "../models/freelancer/work_log.model";
import Invoice from "../models/freelancer/freelancer_invoice.model";
import JobPost from "../models/job/job_post.model";
import UserAccount from "../models/user/user-account.model";

class ExportService {
  public static async exportWorkLogsToExcel(
    userId: string,
    filters: any,
    res: Response
  ): Promise<void> {
    const query: any = { freelancer_id: userId };

    if (filters.start_date && filters.end_date) {
      query.work_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date),
      };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const workLogs = await WorkLog.find(query)
      .populate("project_requirement_id", "job_title")
      .sort({ work_date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Work Logs");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Project", key: "project", width: 30 },
      { header: "Work Type", key: "type", width: 15 },
      { header: "Hours", key: "hours", width: 10 },
      { header: "Description", key: "description", width: 50 },
      { header: "Status", key: "status", width: 12 },
      { header: "Hourly Rate", key: "rate", width: 12 },
      { header: "Amount", key: "amount", width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    let totalHours = 0;
    let totalAmount = 0;

    workLogs.forEach((log: any) => {
      const hours = log.hours_worked || 0;
      const rate = log.hourly_rate || 0;
      const amount = hours * rate;
      totalHours += hours;
      totalAmount += amount;

      worksheet.addRow({
        date: log.work_date ? new Date(log.work_date).toLocaleDateString() : "",
        project: log.project_requirement_id?.job_title || "N/A",
        type: log.work_type || "N/A",
        hours: hours,
        description: log.work_description || "",
        status: log.status || "pending",
        rate: rate,
        amount: amount,
      });
    });

    worksheet.addRow({});
    worksheet.addRow({
      date: "Total",
      hours: totalHours,
      amount: totalAmount,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=work-logs-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  public static async exportInvoiceToPDF(
    invoiceId: string,
    res: Response
  ): Promise<void> {
    const invoice = await Invoice.findById(invoiceId)
      .populate("company_id")
      .populate("affiliation_id")
      .populate("project_requirement_id");

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${(invoice as any).invoice_number || invoiceId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice Number: ${(invoice as any).invoice_number || "N/A"}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Status: ${(invoice as any).status || "draft"}`);
    doc.moveDown();

    doc.fontSize(14).text("Bill To:");
    doc.fontSize(12);
    const company = invoice.company_id as any;
    if (company) {
      doc.text(company.company_name || "N/A");
    }
    doc.moveDown();

    doc.fontSize(14).text("Items:");
    doc.moveDown();

    const items = (invoice as any).items || [];
    let y = doc.y;

    doc.fontSize(10);
    doc.text("Description", 50, y, { width: 200 });
    doc.text("Qty", 260, y, { width: 50, align: "right" });
    doc.text("Unit", 320, y, { width: 50, align: "right" });
    doc.text("Price", 380, y, { width: 70, align: "right" });
    doc.text("Amount", 460, y, { width: 70, align: "right" });

    doc.moveTo(50, y + 15).lineTo(540, y + 15).stroke();
    y += 25;

    let subtotal = 0;
    items.forEach((item: any) => {
      const amount = (item.quantity || 0) * (item.unit_price || 0);
      subtotal += amount;

      doc.text(item.description || "", 50, y, { width: 200 });
      doc.text(String(item.quantity || 0), 260, y, { width: 50, align: "right" });
      doc.text(item.unit || "", 320, y, { width: 50, align: "right" });
      doc.text(String(item.unit_price || 0), 380, y, { width: 70, align: "right" });
      doc.text(String(amount.toFixed(2)), 460, y, { width: 70, align: "right" });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(540, y).stroke();
    y += 10;

    const taxRate = (invoice as any).tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    doc.fontSize(12);
    doc.text(`Subtotal: ${invoice.currency || "CNY"} ${subtotal.toFixed(2)}`, 350, y, {
      width: 180,
      align: "right",
    });
    y += 20;
    doc.text(`Tax (${taxRate}%): ${invoice.currency || "CNY"} ${taxAmount.toFixed(2)}`, 350, y, {
      width: 180,
      align: "right",
    });
    y += 20;
    doc.font("Helvetica-Bold").text(
      `Total: ${invoice.currency || "CNY"} ${total.toFixed(2)}`,
      350,
      y,
      { width: 180, align: "right" }
    );

    if ((invoice as any).notes) {
      doc.moveDown(2);
      doc.font("Helvetica").fontSize(10).text("Notes:");
      doc.text((invoice as any).notes);
    }

    doc.end();
  }

  public static async exportUsersToExcel(
    filters: any,
    res: Response
  ): Promise<void> {
    const query: any = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active === "true";
    }

    const users = await UserAccount.find(query)
      .select("-password")
      .sort({ created_at: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "ID", key: "id", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Name", key: "name", width: 20 },
      { header: "Role", key: "role", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created At", key: "created", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    users.forEach((user: any) => {
      worksheet.addRow({
        id: user._id.toString(),
        email: user.email || "",
        name: user.user_name || "",
        role: user.role || "",
        status: user.is_active ? "Active" : "Inactive",
        created: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  public static async exportProjectsToExcel(
    filters: any,
    res: Response
  ): Promise<void> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.company_id) {
      query.company_id = filters.company_id;
    }

    const projects = await JobPost.find(query)
      .populate("posted_by", "email user_name")
      .populate("company_id", "company_name")
      .sort({ created_date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Projects");

    worksheet.columns = [
      { header: "ID", key: "id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Company", key: "company", width: 25 },
      { header: "Posted By", key: "posted_by", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created At", key: "created", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    projects.forEach((project: any) => {
      worksheet.addRow({
        id: project._id.toString(),
        title: project.job_title || project.job_description?.substring(0, 50) || "",
        company: project.company_id?.company_name || "",
        posted_by: project.posted_by?.user_name || "",
        status: project.status || "",
        created: project.created_date
          ? new Date(project.created_date).toLocaleDateString()
          : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=projects-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}

export default ExportService;
