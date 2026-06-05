import React, { useState, useEffect } from 'react';
import HttpService from '@/core/http.service';
import { CreditCard } from '@/components/credit/CreditCard';
import PageHeader from '@/components/core-ui/PageHeader';
import PortalLayout from '@/components/layouts/portal/PortalLayout';

interface CreditTransaction {
  _id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string;
  created_at: Date;
}

const CreditHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const http = new HttpService();

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, typeFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (typeFilter) params.append('type', typeFilter);

      const response = await http.get(`credits/history?${params.toString()}`);
      setTransactions(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      registration: '注册奖励',
      profile_completion: '完善资料',
      project_completed: '项目完成',
      contract_signed: '签署合同',
      good_rating: '好评奖励',
      bad_rating: '差评扣减',
      report_valid: '有效举报',
      report_invalid: '无效举报',
      violation: '违规处罚',
      admin_adjustment: '管理员调整',
      daily_login: '每日登录',
      referral: '推荐奖励',
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PortalLayout title="我的信用积分">
      <div className="space-y-6">
        <PageHeader
          title="我的信用积分"
          description="查看您的积分余额和变动记录"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "个人中心" },
            { label: "信用积分" },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CreditCard showDetails={true} />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">积分变动记录</h2>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">全部类型</option>
                    <option value="registration">注册奖励</option>
                    <option value="project_completed">项目完成</option>
                    <option value="good_rating">好评奖励</option>
                    <option value="bad_rating">差评扣减</option>
                    <option value="violation">违规处罚</option>
                    <option value="admin_adjustment">管理员调整</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">加载中...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无记录</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <div key={transaction._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getTypeLabel(transaction.type)}
                          </p>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            余额: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-700">
                      共 {pagination.total} 条记录
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {pagination.page} / {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CreditHistoryPage;
