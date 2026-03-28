import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface Payment {
  _id: string;
  invoice_id: {
    _id: string;
    invoice_number: string;
    total_amount: number;
    currency: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  payment_method?: string;
  voucher_url?: string;
  paid_at?: string;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800', icon: CurrencyDollarIcon },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  failed: { label: '失败', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
};

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    pendingCount: 0,
    completedCount: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [paymentsRes, statsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats'),
      ]);

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data || []);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">付款追踪</h1>
          <p className="mt-1 text-sm text-gray-600">跟踪发票付款状态</p>
        </div>
        <button
          onClick={loadPayments}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          刷新
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待付款金额</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.totalPending, 'CNY')}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats.pendingCount} 笔待付款</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已付款金额</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalCompleted, 'CNY')}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats.completedCount} 笔已完成</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">付款记录</h3>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => {
              const StatusIcon = STATUS_CONFIG[payment.status].icon;
              return (
                <div key={payment._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment.status === 'completed' ? 'bg-green-100' :
                        payment.status === 'pending' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        <CurrencyDollarIcon className={`w-6 h-6 ${
                          payment.status === 'completed' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            发票 {payment.invoice_id?.invoice_number}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[payment.status].color}`}>
                            {STATUS_CONFIG[payment.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          创建于 {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        {payment.paid_at && (
                          <p className="text-sm text-gray-500">
                            付款于 {formatDate(payment.paid_at)}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/payments/${payment._id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {payment.status === 'pending' && (
                        <button 
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          data-testid={`confirm-payment-btn-${payment._id}`}
                          onClick={async () => {
                            if (confirm('确认已收到付款？')) {
                              try {
                                await api.post(`/payments/${payment._id}/confirm`);
                                loadPayments();
                              } catch (error) {
                                console.error('Failed to confirm payment:', error);
                                alert('确认付款失败，请重试');
                              }
                            }
                          }}
                        >
                          确认收款
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无付款记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
