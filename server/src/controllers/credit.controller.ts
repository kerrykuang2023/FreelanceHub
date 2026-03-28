import { Request, Response } from "express";
import CreditService from "../services/credit.service";
import { CreditTransactionType } from "../models/credit/credit-transaction.model";

export default class CreditController {
  static async getMyCredit(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const credit = await CreditService.getUserCredit(user._id.toString());
      const stats = await CreditService.getCreditStats(user._id.toString());

      res.json({
        success: true,
        data: {
          balance: credit.current_balance,
          level: credit.level,
          levelInfo: CreditService.getLevelInfo(credit.level),
          totalEarned: credit.total_earned,
          totalSpent: credit.total_spent,
          stats,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credit information" });
    }
  }

  static async getTransactionHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20, type } = req.query;

      const result = await CreditService.getTransactionHistory(
        user._id.toString(),
        Number(page),
        Number(limit),
        type as CreditTransactionType
      );

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  }

  static async adjustCredit(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { userId, amount, description } = req.body;

      if (!userId || !amount || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await CreditService.addCredit(userId, 'admin_adjustment', {
        amount: Number(amount),
        description,
        createdBy: adminUser._id.toString(),
      });

      res.json({
        success: true,
        message: "Credit adjusted successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to adjust credit" });
    }
  }

  static async getUserCredit(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const credit = await CreditService.getUserCredit(userId);
      const stats = await CreditService.getCreditStats(userId);

      res.json({
        success: true,
        data: {
          balance: credit.current_balance,
          level: credit.level,
          levelInfo: CreditService.getLevelInfo(credit.level),
          totalEarned: credit.total_earned,
          totalSpent: credit.total_spent,
          stats,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user credit" });
    }
  }
}
