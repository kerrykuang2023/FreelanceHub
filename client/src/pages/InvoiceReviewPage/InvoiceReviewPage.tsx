import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import invoiceService from '@/services/invoices.service';
import PageHeader from '@/components/core-ui/PageHeader';
import PortalLayout from '@/components/layouts/portal/PortalLayout';

interface IInvoice {
  _id: string;
  invoice_number: string;
  freelancer_id: {
    _id: string;
    user_name: string;
    user_image?: string;
  };
  company_id: {
    _id: string;
    company_name: string;
  };
  invoice_type: string;
  billing_period_start: string;
  billing_period_end: string;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  notes?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  paid: { label: '已付款', color: 'bg-blue-100 text-blue-700' },
};

const InvoiceReviewPage = () => {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('submitted');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices({ status: statusFilter || undefined });
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    try {
      setProcessing(true);
      await invoiceService.approveInvoice(invoiceId);
      loadInvoices();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Failed to approve invoice:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice || !rejectReason.trim()) return;
    try {
      setProcessing(true);
      await invoiceService.rejectInvoice(selectedInvoice._id, rejectReason);
      loadInvoices();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject invoice:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.freelancer_id?.user_name?.toLowerCase().includes(query) ||
      inv.company_id?.company_name?.toLowerCase().includes(query)
    );
  });

  const pendingCount = invoices.filter((i) => i.status === 'submitted').length;

  return (
    <PortalLayout title="发票审核">
      <div className="space-y-6">
      <PageHeader
        title="发票审核"
        description="审核顾问提交的发票"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "企业管理" },
          { label: "发票审核" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
              <ClockIcon className="w-4 h-4 mr-1" />
              {pendingCount} 待审核
            </span>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索发票号、顾问、公司..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="submitted">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
                <option value="">全部状态</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无发票</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'submitted' ? '没有待审核的发票' : '没有符合条件的发票'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    发票号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    顾问
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    公司
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    账单周期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="invoices-tbody">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} data-testid={`invoice-row-${invoice._id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {invoice.freelancer_id?.user_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {invoice.company_id?.company_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.currency} {invoice.total_amount?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.billing_period_start).toLocaleDateString('zh-CN')} - 
                      {new Date(invoice.billing_period_end).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusConfig[invoice.status]?.color || 'bg-gray-100 text-gray-700'
                      }`}>
                        {statusConfig[invoice.status]?.label || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailModal(true);
                          }}
                          data-testid={`view-invoice-${invoice._id}`}
                          className="text-gray-400 hover:text-blue-600"
                          title="查看详情"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {invoice.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleApprove(invoice._id)}
                              data-testid={`approve-invoice-${invoice._id}`}
                              className="text-gray-400 hover:text-green-600"
                              title="通过"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowRejectModal(true);
                              }}
                              data-testid={`reject-invoice-${invoice._id}`}
                              className="text-gray-400 hover:text-red-600"
                              title="驳回"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowDetailModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">发票详情</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-500">
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">发票号</label>
                    <p className="font-medium">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">发票类型</label>
                    <p className="font-medium">{selectedInvoice.invoice_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">顾问</label>
                    <p className="font-medium">{selectedInvoice.freelancer_id?.user_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">公司</label>
                    <p className="font-medium">{selectedInvoice.company_id?.company_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">账单周期</label>
                    <p className="font-medium">
                      {new Date(selectedInvoice.billing_period_start).toLocaleDateString('zh-CN')} - 
                      {new Date(selectedInvoice.billing_period_end).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">状态</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusConfig[selectedInvoice.status]?.color
                    }`}>
                      {statusConfig[selectedInvoice.status]?.label}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">金额明细</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">小计</span>
                      <span>{selectedInvoice.currency} {selectedInvoice.subtotal_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">税额</span>
                      <span>{selectedInvoice.currency} {selectedInvoice.tax_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>总计</span>
                      <span className="text-blue-600">{selectedInvoice.currency} {selectedInvoice.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <label className="text-sm text-gray-500">备注</label>
                    <p className="text-gray-700">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              {selectedInvoice.status === 'submitted' && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    驳回
                  </button>
                  <button
                    onClick={() => handleApprove(selectedInvoice._id)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? '处理中...' : '通过审核'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowRejectModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">驳回发票</h3>
              <p className="text-sm text-gray-500 mb-4">
                请填写驳回原因，顾问将收到通知并可以修改后重新提交。
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? '处理中...' : '确认驳回'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </PortalLayout>
  );
};

export default InvoiceReviewPage;
