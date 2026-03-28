import React, { useState, useEffect } from 'react';
import HttpService from '@/core/http.service';
import PageHeader from '@/components/core-ui/PageHeader';

interface Report {
  _id: string;
  reporter_id: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  target_type: string;
  target_id: string;
  target_user_id?: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  report_type: string;
  description: string;
  attachments: string[];
  status: string;
  priority: string;
  reviewed_by?: {
    _id: string;
    email: string;
  };
  reviewed_at?: Date;
  review_notes?: string;
  action_taken?: string;
  created_at: Date;
}

const AdminReportManagementPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: '',
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    action_taken: '',
    credit_deduction: 0,
    review_notes: '',
  });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const http = new HttpService();

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.report_type) params.append('report_type', filters.report_type);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await http.get(`user-reports/all?${params.toString()}`);
      setReports(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await http.get('user-reports/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleVerify = async () => {
    if (!selectedReport) return;

    try {
      setProcessing(true);
      await http.put(`user-reports/${selectedReport._id}/verify`, verifyForm);
      setShowVerifyModal(false);
      setSelectedReport(null);
      setVerifyForm({ action_taken: '', credit_deduction: 0, review_notes: '' });
      fetchReports();
      fetchStats();
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm('确定要驳回此举报吗？')) return;

    try {
      await http.put(`user-reports/${reportId}/dismiss`, {
        review_notes: '管理员驳回',
      });
      fetchReports();
      fetchStats();
    } catch (error) {
      alert('驳回失败，请重试');
    }
  };

  const handleStartInvestigation = async (reportId: string) => {
    try {
      await http.put(`user-reports/${reportId}/investigate`);
      fetchReports();
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      spam: '垃圾信息',
      harassment: '骚扰行为',
      fake_profile: '虚假资料',
      scam: '诈骗行为',
      inappropriate_content: '不当内容',
      copyright: '版权侵权',
      payment_issue: '支付问题',
      contract_dispute: '合同纠纷',
      other: '其他问题',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
      resolved: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      investigating: '调查中',
      verified: '已验证',
      dismissed: '已驳回',
      resolved: '已解决',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[priority] || ''}`}>
        {labels[priority] || priority}
      </span>
    );
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="举报管理"
          description="处理用户提交的举报"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "系统管理" },
            { label: "举报管理" },
          ]}
        />

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.summary?.totalPending || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">已验证</p>
              <p className="text-2xl font-bold text-green-600">{stats.summary?.totalVerified || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">已驳回</p>
              <p className="text-2xl font-bold text-gray-600">{stats.summary?.totalDismissed || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">总计</p>
              <p className="text-2xl font-bold text-blue-600">{stats.summary?.total || 0}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="investigating">调查中</option>
                <option value="verified">已验证</option>
                <option value="dismissed">已驳回</option>
              </select>
              <select
                value={filters.report_type}
                onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">全部类型</option>
                <option value="spam">垃圾信息</option>
                <option value="harassment">骚扰行为</option>
                <option value="scam">诈骗行为</option>
                <option value="fake_profile">虚假资料</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">全部优先级</option>
                <option value="urgent">紧急</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无举报记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">举报人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">被举报用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporter_id?.first_name} {report.reporter_id?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{report.reporter_id?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{getReportTypeLabel(report.report_type)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.target_user_id ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {report.target_user_id.first_name} {report.target_user_id.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{report.target_user_id.email}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(report.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          详情
                        </button>
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStartInvestigation(report._id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              开始调查
                            </button>
                            <button
                              onClick={() => handleDismiss(report._id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              驳回
                            </button>
                          </>
                        )}
                        {report.status === 'investigating' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setShowVerifyModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              验证
                            </button>
                            <button
                              onClick={() => handleDismiss(report._id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              驳回
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {selectedReport && !showVerifyModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">举报详情</h3>
                  <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">举报人</p>
                      <p className="text-sm font-medium">
                        {selectedReport.reporter_id?.first_name} {selectedReport.reporter_id?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{selectedReport.reporter_id?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">被举报用户</p>
                      {selectedReport.target_user_id ? (
                        <>
                          <p className="text-sm font-medium">
                            {selectedReport.target_user_id.first_name} {selectedReport.target_user_id.last_name}
                          </p>
                          <p className="text-xs text-gray-400">{selectedReport.target_user_id.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">-</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">举报类型</p>
                    <p className="text-sm font-medium">{getReportTypeLabel(selectedReport.report_type)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">举报内容</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-1">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">状态</p>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">优先级</p>
                      {getPriorityBadge(selectedReport.priority)}
                    </div>
                  </div>

                  {selectedReport.review_notes && (
                    <div>
                      <p className="text-sm text-gray-500">处理备注</p>
                      <p className="text-sm text-gray-700">{selectedReport.review_notes}</p>
                    </div>
                  )}

                  {selectedReport.action_taken && (
                    <div>
                      <p className="text-sm text-gray-500">处理措施</p>
                      <p className="text-sm text-gray-700">{selectedReport.action_taken}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    关闭
                  </button>
                  {selectedReport.status === 'investigating' && (
                    <button
                      onClick={() => setShowVerifyModal(true)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      验证举报
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showVerifyModal && selectedReport && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">验证举报</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">处理措施</label>
                    <textarea
                      value={verifyForm.action_taken}
                      onChange={(e) => setVerifyForm({ ...verifyForm, action_taken: e.target.value })}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="例如：警告用户、冻结账户等"
                    />
                  </div>

                  {selectedReport.target_user_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">积分扣减</label>
                      <input
                        type="number"
                        value={verifyForm.credit_deduction}
                        onChange={(e) => setVerifyForm({ ...verifyForm, credit_deduction: Number(e.target.value) })}
                        min={0}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="扣减积分数量"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                    <textarea
                      value={verifyForm.review_notes}
                      onChange={(e) => setVerifyForm({ ...verifyForm, review_notes: e.target.value })}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="内部备注"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowVerifyModal(false);
                      setVerifyForm({ action_taken: '', credit_deduction: 0, review_notes: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={processing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    确认验证
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportManagementPage;
