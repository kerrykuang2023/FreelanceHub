import { Response } from 'express';
import { IAuthRequest } from '../types/user.interface';
import PaymentService from '../services/payment.service';

class PaymentController {
  public createPayment = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return; 
      }

      const payment = await PaymentService.createPayment(req.body, userId);
      res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
    }
  };

  public getPayments = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { invoice_id, status, page, pageSize } = req.query;

      const result = await PaymentService.getPayments({
        invoice_id: invoice_id as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public getPaymentById = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
        });
        return;
      }
      res.json({ success: true, data: payment });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };

  public confirmPayment = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
        return;
      }

      const payment = await PaymentService.confirmPayment(
        { payment_id: req.params.id, notes: req.body.notes },
        userId
      );

      res.json({ success: true, data: payment, message: 'Payment confirmed' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CONFIRM_ERROR', message: error.message },
      });
    }
  };

  public uploadVoucher = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { voucherUrl } = req.body;
      const payment = await PaymentService.uploadVoucher(req.params.id, voucherUrl);

      res.json({ success: true, data: payment, message: 'Voucher uploaded' });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: error.message },
      });
    }
  };

  public getPaymentStats = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.query;
      const stats = await PaymentService.getPaymentStats(companyId as string);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message },
      });
    }
  };
}

export default new PaymentController();
