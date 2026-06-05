import React, { useEffect, useState } from 'react';
import HttpService from '@/core/http.service';
import { useAuth } from '@/providers';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface RoleApproval {
  _id?: string;
  id?: string;
  user_id: {
    _id?: string;
    id?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    user_image?: string;
  };
  role_type: string;
  status: ApprovalStatus;
  submitted_data?: Record<string, any>;
  reviewed_by?: {
    _id?: string;
    id?: string;
    email: string;
  };
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at?: string;
  createdAt?: string;
  expires_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const roleLabels: Record<string, string> = {
  job_seeker: '顾问/求职者',
  hr_recruiter: '企业/HR',
  admin: '平台管理员',
};

const statusLabels: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', className: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
};

const http = new HttpService();

const RoleApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<RoleApproval[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<RoleApproval | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      setActionError(getApiErrorMessage(error, '加载角色申请失败，请刷新后重试'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [pagination.page, statusFilter, roleTypeFilter]);

  const getApiErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.error?.message === 'string') return data.error.message;
    return fallback;
  };

  const getApprovalId = (approval: RoleApproval) => approval._id || approval.id || '';
  const getApplicantId = (approval: RoleApproval) => approval.user_id?._id || approval.user_id?.id;
  const isOwnApproval = (approval: RoleApproval) => {
    const currentUserId = (user as any)?.id || (user as any)?._id;
    return Boolean(currentUserId && getApplicantId(approval) === currentUserId);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCreatedAt = (approval: RoleApproval) => approval.created_at || approval.createdAt;

  const handleApprove = async (approval: RoleApproval) => {
    if (isOwnApproval(approval)) {
      setActionError('不能审批自己的角色申请，请由其他平台管理员处理');
      return;
    }
    if (!window.confirm('确定批准此角色申请吗？')) return;

    try {
      setProcessing(true);
      setActionError(null);
      await http.put(`admin/role-approvals/${getApprovalId(approval)}/approve`, { review_notes: reviewNotes });
      await fetchApprovals();
      setSelectedApproval(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to approve:', error);
      setActionError(getApiErrorMessage(error, '批准失败，请重试'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (isOwnApproval(selectedApproval)) {
      setActionError('不能拒绝自己的角色申请，请由其他平台管理员处理');
      return;
    }
    if (!rejectionReason.trim()) {
      setActionError('请输入拒绝原因');
      return;
    }

    try {
      setProcessing(true);
      setActionError(null);
      await http.put(`admin/role-approvals/${getApprovalId(selectedApproval)}/reject`, {
        rejection_reason: rejectionReason.trim(),
        review_notes: reviewNotes.trim(),
      });
      await fetchApprovals();
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectionReason('');
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to reject:', error);
      setActionError(getApiErrorMessage(error, '拒绝失败，请重试'));
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (approval: RoleApproval) => {
    setSelectedApproval(approval);
    setActionError(null);
    setRejectionReason('');
    setReviewNotes('');
    setShowRejectModal(true);
  };

  const getApplicantName = (approval: RoleApproval) => {
    const fullName = `${approval.user_id?.first_name || ''} ${approval.user_id?.last_name || ''}`.trim();
    return fullName || approval.user_id?.email || '-';
  };

  const renderStatusBadge = (status: ApprovalStatus) => {
    const meta = statusLabels[status];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  const renderSubmittedData = (approval: RoleApproval) => {
    const data = approval.submitted_data || {};
    const entries = [
      ['申请原因', data.application_reason],
      ['技能', Array.isArray(data.skills) ? data.skills.join('、') : undefined],
      ['经验说明', data.professional_summary],
      ['公司名称', data.company_name],
      ['岗位/职能', data.position],
    ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0);

    if (entries.length === 0) {
      return <p className="text-sm text-amber-700">申请资料不完整，请拒绝并要求申请人补充后重新提交。</p>;
    }

    return (
      <dl className="space-y-2">
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  return (
    <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">角色审批管理</h1>
          <p className="mt-1 text-sm text-gray-500">审核用户提交的角色申请和补充资料</p>
        </div>

        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="role-approval-error">
            {actionError}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
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
                  onChange={(event) => {
                    setRoleTypeFilter(event.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">全部角色</option>
                  <option value="job_seeker">顾问/求职者</option>
                  <option value="hr_recruiter">企业/HR</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审批人</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvals.map((approval) => {
                    const ownApproval = isOwnApproval(approval);
                    return (
                      <tr key={getApprovalId(approval)} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {getApplicantName(approval)[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{getApplicantName(approval)}</div>
                              <div className="text-sm text-gray-500">{approval.user_id?.email}</div>
                              {ownApproval && <div className="text-xs text-amber-600">自己的申请，需其他管理员审批</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {roleLabels[approval.role_type] || approval.role_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(approval.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid="role-approval-created-at">
                          {formatDate(getCreatedAt(approval))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.reviewed_by?.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {approval.status === 'pending' ? (
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => setSelectedApproval(approval)} className="text-indigo-600 hover:text-indigo-900">
                                查看
                              </button>
                              <button
                                onClick={() => handleApprove(approval)}
                                disabled={processing || ownApproval}
                                title={ownApproval ? '自己的申请需其他管理员审批' : undefined}
                                className="text-green-600 hover:text-green-900 disabled:cursor-not-allowed disabled:text-gray-400"
                              >
                                批准
                              </button>
                              <button
                                onClick={() => openRejectModal(approval)}
                                disabled={processing || ownApproval}
                                title={ownApproval ? '自己的申请需其他管理员审批' : undefined}
                                className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:text-gray-400"
                              >
                                拒绝
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setSelectedApproval(approval)} className="text-indigo-600 hover:text-indigo-900">
                              查看详情
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedApproval && !showRejectModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">申请详情</h3>
                  <button onClick={() => setSelectedApproval(null)} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">关闭</span>
                    <span aria-hidden="true" className="text-2xl leading-none">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请人信息</h4>
                    <p className="mt-1 text-sm text-gray-900">{getApplicantName(selectedApproval)}</p>
                    <p className="text-sm text-gray-500">{selectedApproval.user_id?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请角色</h4>
                    <p className="mt-1 text-sm text-gray-900">{roleLabels[selectedApproval.role_type] || selectedApproval.role_type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">状态</h4>
                    <div className="mt-1">{renderStatusBadge(selectedApproval.status)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请时间</h4>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(getCreatedAt(selectedApproval))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请资料</h4>
                    <div className="mt-2 rounded-lg bg-gray-50 p-3">{renderSubmittedData(selectedApproval)}</div>
                  </div>

                  {selectedApproval.status === 'pending' && !isOwnApproval(selectedApproval) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">审批备注</h4>
                      <textarea
                        value={reviewNotes}
                        onChange={(event) => setReviewNotes(event.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="可选：添加审批备注"
                      />
                    </div>
                  )}

                  {(selectedApproval.review_notes || selectedApproval.rejection_reason) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">审批意见</h4>
                      {selectedApproval.review_notes && <p className="mt-1 text-sm text-gray-900">备注：{selectedApproval.review_notes}</p>}
                      {selectedApproval.rejection_reason && <p className="mt-1 text-sm text-red-600">拒绝原因：{selectedApproval.rejection_reason}</p>}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedApproval(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    关闭
                  </button>
                  {selectedApproval.status === 'pending' && !isOwnApproval(selectedApproval) && (
                    <>
                      <button
                        onClick={() => openRejectModal(selectedApproval)}
                        className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => handleApprove(selectedApproval)}
                        disabled={processing}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        批准
                      </button>
                    </>
                  )}
                </div>
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
                      onChange={(event) => setRejectionReason(event.target.value)}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="请说明需要申请人补充或修正的内容"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">审批备注（可选）</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="添加内部备注"
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
  );
};

export default RoleApprovalsPage;
