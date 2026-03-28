import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HttpService from '@/core/http.service';

interface RoleApproval {
  _id: string;
  user_id: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    user_image?: string;
  };
  role_type: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_data: any;
  reviewed_by?: {
    _id: string;
    email: string;
  };
  reviewed_at?: Date;
  review_notes?: string;
  rejection_reason?: string;
  created_at: Date;
  expires_at: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const RoleApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<RoleApproval[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>('');
  const [selectedApproval, setSelectedApproval] = useState<RoleApproval | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const http = new HttpService();

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (roleTypeFilter) params.append('role_type', roleTypeFilter);

      const response = await http.get(`admin/role-approvals?${params.toString()}`);
      setApprovals(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [pagination.page, statusFilter, roleTypeFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('确定要批准此角色申请吗？')) return;
    
    try {
      setProcessing(true);
      await http.put(`admin/role-approvals/${id}/approve`, { review_notes: reviewNotes });
      fetchApprovals();
      setSelectedApproval(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('批准失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }

    try {
      setProcessing(true);
      await http.put(`admin/role-approvals/${selectedApproval?._id}/reject`, {
        rejection_reason: rejectionReason,
        review_notes: reviewNotes,
      });
      fetchApprovals();
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectionReason('');
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('拒绝失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (roleType: string) => {
    const labels: Record<string, string> = {
      job_seeker: '求职者',
      hr_recruiter: 'HR招聘官',
      admin: '管理员',
    };
    return labels[roleType] || roleType;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">待审批</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">已批准</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">已拒绝</span>;
      default:
        return null;
    }
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">角色审批管理</h1>
          <p className="mt-1 text-sm text-gray-500">审核用户的角色申请</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待审批</option>
                  <option value="approved">已批准</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色类型</label>
                <select
                  value={roleTypeFilter}
                  onChange={(e) => {
                    setRoleTypeFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">全部角色</option>
                  <option value="job_seeker">求职者</option>
                  <option value="hr_recruiter">HR招聘官</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : approvals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无审批记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      审批人
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvals.map((approval) => (
                    <tr key={approval._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {approval.user_id?.first_name?.[0]?.toUpperCase() || 
                             approval.user_id?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {approval.user_id?.first_name} {approval.user_id?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {approval.user_id?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleLabel(approval.role_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(approval.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(approval.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.reviewed_by?.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {approval.status === 'pending' ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setReviewNotes('');
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              查看
                            </button>
                            <button
                              onClick={() => handleApprove(approval._id)}
                              disabled={processing}
                              className="text-green-600 hover:text-green-900"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowRejectModal(true);
                                setRejectionReason('');
                                setReviewNotes('');
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              拒绝
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedApproval(approval)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            查看详情
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    条，共 <span className="font-medium">{pagination.total}</span> 条
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedApproval && !showRejectModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">申请详情</h3>
                  <button
                    onClick={() => setSelectedApproval(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请人信息</h4>
                    <div className="mt-2 flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {selectedApproval.user_id?.first_name?.[0]?.toUpperCase() || 
                         selectedApproval.user_id?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedApproval.user_id?.first_name} {selectedApproval.user_id?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedApproval.user_id?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请角色</h4>
                    <p className="mt-1 text-sm text-gray-900">{getRoleLabel(selectedApproval.role_type)}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">状态</h4>
                    <div className="mt-1">{getStatusBadge(selectedApproval.status)}</div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请时间</h4>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedApproval.created_at)}</p>
                  </div>

                  {selectedApproval.submitted_data && Object.keys(selectedApproval.submitted_data).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">提交数据</h4>
                      <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedApproval.submitted_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedApproval.status === 'pending' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">审批备注</h4>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="可选：添加审批备注..."
                      />
                    </div>
                  )}

                  {(selectedApproval.review_notes || selectedApproval.rejection_reason) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">审批意见</h4>
                      {selectedApproval.review_notes && (
                        <p className="mt-1 text-sm text-gray-900">备注: {selectedApproval.review_notes}</p>
                      )}
                      {selectedApproval.rejection_reason && (
                        <p className="mt-1 text-sm text-red-600">拒绝原因: {selectedApproval.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>

                {selectedApproval.status === 'pending' && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      拒绝
                    </button>
                    <button
                      onClick={() => handleApprove(selectedApproval._id)}
                      disabled={processing}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      批准
                    </button>
                  </div>
                )}

                {selectedApproval.status !== 'pending' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRejectModal && selectedApproval && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝申请</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      拒绝原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="请输入拒绝原因..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      审批备注（可选）
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="添加审批备注..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    确认拒绝
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

export default RoleApprovalsPage;
