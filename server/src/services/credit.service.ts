import UserCredit, { CreditLevel } from '../models/credit/user-credit.model';
import CreditTransaction, { CreditTransactionType } from '../models/credit/credit-transaction.model';

interface CreditRule {
  type: CreditTransactionType;
  amount: number;
  description: string;
}

const CREDIT_RULES: Record<string, CreditRule> = {
  registration: { type: 'registration', amount: 50, description: '新用户注册奖励' },
  profile_completion: { type: 'profile_completion', amount: 20, description: '完善个人资料' },
  project_completed: { type: 'project_completed', amount: 30, description: '项目完成奖励' },
  contract_signed: { type: 'contract_signed', amount: 15, description: '签署合同奖励' },
  good_rating: { type: 'good_rating', amount: 10, description: '获得好评奖励' },
  bad_rating: { type: 'bad_rating', amount: -10, description: '收到差评扣减' },
  report_valid: { type: 'report_valid', amount: 5, description: '有效举报奖励' },
  report_invalid: { type: 'report_invalid', amount: -5, description: '无效举报扣减' },
  violation: { type: 'violation', amount: -50, description: '违规处罚' },
  daily_login: { type: 'daily_login', amount: 1, description: '每日登录奖励' },
  referral: { type: 'referral', amount: 25, description: '推荐新用户奖励' },
};

class CreditService {
  static async getUserCredit(userId: string) {
    let userCredit = await UserCredit.findOne({ user_id: userId });

    if (!userCredit) {
      userCredit = await UserCredit.create({
        user_id: userId,
        current_balance: 0,
        total_earned: 0,
        total_spent: 0,
        level: 'bronze',
      });
    }

    return userCredit;
  }

  static async addCredit(
    userId: string,
    type: CreditTransactionType,
    options: {
      amount?: number;
      description?: string;
      referenceType?: string;
      referenceId?: string;
      createdBy?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    const rule = CREDIT_RULES[type];
    const amount = options.amount ?? rule?.amount ?? 0;
    const description = options.description ?? rule?.description ?? type;

    const userCredit = await this.getUserCredit(userId);
    const previousBalance = userCredit.current_balance;
    const newBalance = Math.max(0, previousBalance + amount);

    const transaction = await CreditTransaction.create({
      user_id: userId,
      amount,
      balance_after: newBalance,
      type,
      description,
      reference_type: options.referenceType,
      reference_id: options.referenceId,
      created_by: options.createdBy,
      metadata: options.metadata,
    });

    userCredit.current_balance = newBalance;
    if (amount > 0) {
      userCredit.total_earned += amount;
    } else {
      userCredit.total_spent += Math.abs(amount);
    }
    await userCredit.save();

    return {
      transaction,
      userCredit,
    };
  }

  static async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: CreditTransactionType
  ) {
    const query: any = { user_id: userId };
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'email'),
      CreditTransaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async initializeUserCredit(userId: string) {
    const existing = await UserCredit.findOne({ user_id: userId });
    if (existing) {
      return existing;
    }

    const userCredit = await UserCredit.create({
      user_id: userId,
      current_balance: 0,
      total_earned: 0,
      total_spent: 0,
      level: 'bronze',
    });

    await this.addCredit(userId, 'registration');

    return userCredit;
  }

  static async getCreditStats(userId: string) {
    const userCredit = await this.getUserCredit(userId);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentTransactions = await CreditTransaction.aggregate([
      {
        $match: {
          user_id: userCredit.user_id,
          created_at: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const levelProgress = this.calculateLevelProgress(userCredit.current_balance);

    return {
      balance: userCredit.current_balance,
      level: userCredit.level,
      totalEarned: userCredit.total_earned,
      totalSpent: userCredit.total_spent,
      recentTransactions,
      levelProgress,
    };
  }

  static calculateLevelProgress(balance: number): { current: number; next: number; progress: number } {
    const levels = [
      { name: 'bronze', min: 0, max: 99 },
      { name: 'silver', min: 100, max: 499 },
      { name: 'gold', min: 500, max: 999 },
      { name: 'platinum', min: 1000, max: Infinity },
    ];

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      if (balance >= level.min && balance <= level.max) {
        if (i === levels.length - 1) {
          return { current: balance, next: balance, progress: 100 };
        }
        const nextLevel = levels[i + 1];
        const range = level.max - level.min + 1;
        const progress = ((balance - level.min) / range) * 100;
        return {
          current: balance,
          next: nextLevel.min,
          progress: Math.min(100, Math.max(0, progress)),
        };
      }
    }

    return { current: balance, next: 100, progress: 0 };
  }

  static getLevelInfo(level: CreditLevel): { name: string; color: string; icon: string; benefits: string[] } {
    const levelInfo: Record<CreditLevel, { name: string; color: string; icon: string; benefits: string[] }> = {
      bronze: {
        name: '青铜会员',
        color: 'text-amber-700 bg-amber-100',
        icon: '🥉',
        benefits: ['基础功能使用', '每日登录奖励'],
      },
      silver: {
        name: '白银会员',
        color: 'text-gray-600 bg-gray-200',
        icon: '🥈',
        benefits: ['基础功能使用', '每日登录奖励', '优先客服支持', '项目推荐'],
      },
      gold: {
        name: '黄金会员',
        color: 'text-yellow-600 bg-yellow-100',
        icon: '🥇',
        benefits: ['基础功能使用', '每日登录奖励', '优先客服支持', '项目推荐', '专属活动', '更高曝光度'],
      },
      platinum: {
        name: '铂金会员',
        color: 'text-purple-600 bg-purple-100',
        icon: '💎',
        benefits: ['全部功能使用', '每日登录奖励', '专属客服经理', '优先项目推荐', '专属活动', '最高曝光度', '专属标识'],
      },
    };

    return levelInfo[level];
  }
}

export default CreditService;
