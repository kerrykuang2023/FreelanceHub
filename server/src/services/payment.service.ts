import FreelancerInvoice from '../models/freelancer/freelancer_invoice.model';
import PaymentRecord from '../models/freelancer/payment_record.model';
import MessageService from './message.service';

export interface CreatePaymentDTO {
  invoice_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number?: string;
  voucher_url?: string;
  notes?: string;
}

export interface ConfirmPaymentDTO {
  payment_id: string;
  notes?: string;
}

class PaymentService {
  private static INSTANCE: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.INSTANCE) {
      PaymentService.INSTANCE = new PaymentService();
    }
    return PaymentService.INSTANCE;
  }

  public async createPayment(data: CreatePaymentDTO, paidBy: string): Promise<any> {
    const invoice = await FreelancerInvoice.findById(data.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if ((invoice as any).status !== 'approved') {
      throw new Error('Invoice must be approved before payment');
    }

    const payment = await PaymentRecord.create({
      invoice_id: data.invoice_id,
      freelancer_id: (invoice as any).freelancer_id,
      company_id: (invoice as any).company_id,
      affiliation_id: (invoice as any).affiliation_id,
      payment_type: '项目款',
      payment_status: 'paid',
      payment_period_start: new Date(),
      payment_period_end: new Date(),
      payment_date: new Date(),
      notes: data.notes,
      transfer_reference: data.reference_number,
      transfer_date: new Date(),
    });

    (invoice as any).status = 'paid';
    (invoice as any).payment_date = new Date();
    await invoice.save();

    const freelancerId = (invoice as any).freelancer_id?.toString();
    if (freelancerId) {
      await MessageService.createSystemMessage(
        freelancerId,
        '付款已确认',
        `您的发票已付款，金额${data.amount} ${data.currency}`,
        'payment',
        `/invoices/${invoice._id}`,
        invoice._id.toString()
      );
    }

    return payment;
  }

  public async getPayments(options: {
    invoice_id?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: any[]; total: number }> {
    const { invoice_id, status, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (invoice_id) filter.invoice_id = invoice_id;
    if (status) filter.payment_status = status;

    const [items, total] = await Promise.all([
      PaymentRecord.find(filter)
        .populate('invoice_id')
        .populate('reconciled_by', 'email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      PaymentRecord.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getPaymentById(id: string): Promise<any | null> {
    return PaymentRecord.findById(id)
      .populate('invoice_id')
      .populate('reconciled_by', 'email');
  }

  public async confirmPayment(data: ConfirmPaymentDTO, confirmedBy: string): Promise<any> {
    const payment = await PaymentRecord.findById(data.payment_id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if ((payment as any).payment_status !== 'paid') {
      throw new Error('Payment must be in paid status to confirm');
    }

    (payment as any).payment_status = 'verified';
    (payment as any).reconciled_by = confirmedBy as any;
    (payment as any).reconciled_at = new Date();
    if (data.notes) (payment as any).notes = data.notes;

    await payment.save();

    const invoice = await FreelancerInvoice.findById((payment as any).invoice_id);
    if (invoice) {
      (invoice as any).status = 'confirmed';
      await invoice.save();
    }

    return payment;
  }

  public async uploadVoucher(paymentId: string, voucherUrl: string): Promise<any> {
    const payment = await PaymentRecord.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    (payment as any).transfer_reference = voucherUrl;
    await payment.save();

    return payment;
  }

  public async getPaymentStats(companyId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    pendingConfirmations: number;
    byCurrency: { [key: string]: { count: number; amount: number } };
  }> {
    const matchFilter: any = {};
    if (companyId) {
      matchFilter.company_id = companyId;
    }

    const payments = await PaymentRecord.find(matchFilter);

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + ((p as any).payment_amount || 0), 0);
    const pendingConfirmations = payments.filter((p) => (p as any).payment_status === 'paid').length;

    const byCurrency: { [key: string]: { count: number; amount: number } } = {};
    for (const payment of payments) {
      const currency = (payment as any).currency || 'CNY';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { count: 0, amount: 0 };
      }
      byCurrency[currency].count++;
      byCurrency[currency].amount += (payment as any).payment_amount || 0;
    }

    return { totalPayments, totalAmount, pendingConfirmations, byCurrency };
  }
}

export default PaymentService.getInstance();
