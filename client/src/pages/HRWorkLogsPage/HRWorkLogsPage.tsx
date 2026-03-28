import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  IWorkLog,
  WORK_LOG_STATUS_COLORS,
  WORK_LOG_STATUS_TEXT,
  WorkLogStatus,
} from "@/interfaces/models/worklog";
import workLogService from "@/services/worklogs.service";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

const HRWorkLogsPage = () => {
  const [workLogs, setWorkLogs] = useState<IWorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkLogStatus | "all">("submitted");
  const [selectedWorkLog, setSelectedWorkLog] = useState<IWorkLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [workLogToReject, setWorkLogToReject] = useState<IWorkLog | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });

  useEffect(() => {
    loadWorkLogs();
  }, [statusFilter, pagination.current_page]);

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await workLogService.getPendingWorkLogsForCompany({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.work_logs) {
        setWorkLogs(response.work_logs);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, current_page: 1 });
    loadWorkLogs();
  };

  const handleConfirmWorkLog = async (id: string) => {
    try {
      await workLogService.confirmWorkLog(id);
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to confirm work log:", error);
    }
  };

  const handleRejectWorkLog = async () => {
    if (!workLogToReject || !rejectReason.trim()) return;
    try {
      await workLogService.rejectWorkLog(workLogToReject._id, rejectReason);
      setShowRejectModal(false);
      setWorkLogToReject(null);
      setRejectReason("");
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to reject work log:", error);
    }
  };

  const openRejectModal = (workLog: IWorkLog) => {
    setWorkLogToReject(workLog);
    setShowRejectModal(true);
  };

  const filteredWorkLogs = workLogs.filter((log) =>
    log.freelancer_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.project_requirement_id?.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getStatusIcon = (status: WorkLogStatus) => {
    switch (status) {
      case "draft":
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
      case "submitted":
        return <ClockIcon className="w-4 h-4 text-amber-500" />;
      case "confirmed":
        return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case "rejected":
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <PortalLayout title="工时审核">
      <div className="space-y-6">
        <PageHeader
          title="工时审核"
          description="审核并确认 freelancers 提交的工时记录"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "企业管理" },
            { label: "工时审核" },
          ]}
          actions={
            <button
              onClick={() => loadWorkLogs()}
              data-testid="refresh-worklogs-btn"
              className="btn-secondary"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              刷新
            </button>
          }
        />

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索 freelancers 或项目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </form>

            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as WorkLogStatus | "all");
                  setPagination({ ...pagination, current_page: 1 });
                }}
                className="input-field w-auto"
              >
                <option value="all">全部状态</option>
                <option value="submitted">已提交</option>
                <option value="confirmed">已确认</option>
                <option value="rejected">已驳回</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredWorkLogs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Freelancer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        项目
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        工作日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        工时类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        工时数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkLogs.map((workLog) => (
                      <tr key={workLog._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {typeof workLog.freelancer_id === 'object'
                              ? workLog.freelancer_id?.display_name
                              : "Freelancer"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {typeof workLog.project_requirement_id === 'object'
                              ? workLog.project_requirement_id?.project_title
                              : "项目"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(workLog.work_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {workLog.work_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {workLog.hours_worked}h
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${
                            workLog.status === 'draft' ? 'status-badge-pending' :
                            workLog.status === 'submitted' ? 'bg-amber-50 text-amber-700' :
                            workLog.status === 'confirmed' ? 'status-badge-approved' :
                            'status-badge-rejected'
                          }`}>
                            {getStatusIcon(workLog.status)}
                            <span className="ml-1">{WORK_LOG_STATUS_TEXT[workLog.status]}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedWorkLog(workLog);
                                setShowDetailModal(true);
                              }}
                              data-testid={`view-worklog-${workLog._id}`}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            {workLog.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => handleConfirmWorkLog(workLog._id)}
                                  data-testid={`confirm-worklog-${workLog._id}`}
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="确认"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => openRejectModal(workLog)}
                                  data-testid={`reject-worklog-${workLog._id}`}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              {pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    显示 {(pagination.current_page - 1) * pagination.items_per_page + 1} 到{" "}
                    {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} 条，
                    共 {pagination.total_items} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                      disabled={pagination.current_page === 1}
                      className="btn-secondary"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="btn-secondary"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无待审核工时</h3>
              <p className="text-sm text-gray-500">当前没有需要审核的工时记录</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedWorkLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-xl animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">工时详情</h3>
                  <button 
                    onClick={() => setShowDetailModal(false)} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Freelancer</label>
                      <p className="text-base text-gray-900 mt-1 font-medium">
                        {typeof selectedWorkLog.freelancer_id === 'object'
                          ? selectedWorkLog.freelancer_id?.display_name
                          : "Freelancer"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">项目</label>
                      <p className="text-base text-gray-900 mt-1 font-medium">
                        {typeof selectedWorkLog.project_requirement_id === 'object'
                          ? selectedWorkLog.project_requirement_id?.project_title
                          : "项目"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工作日期</label>
                      <p className="text-base text-gray-900 mt-1 font-medium">{formatDate(selectedWorkLog.work_date)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工作时段</label>
                      <p className="text-base text-gray-900 mt-1 font-medium">
                        {selectedWorkLog.work_period_start} - {selectedWorkLog.work_period_end}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工时类型</label>
                      <p className="text-base text-gray-900 mt-1">{selectedWorkLog.work_type}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工时数</label>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkLog.hours_worked}h</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工作描述</label>
                    <p className="text-base text-gray-900 mt-1">{selectedWorkLog.work_description}</p>
                  </div>
                  {selectedWorkLog.work_content_detail && (
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工作内容详情</label>
                      <p className="text-base text-gray-900 mt-1">{selectedWorkLog.work_content_detail}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">状态</label>
                    <span className={`status-badge mt-2 inline-flex ${
                      selectedWorkLog.status === 'draft' ? 'status-badge-pending' :
                      selectedWorkLog.status === 'submitted' ? 'bg-amber-50 text-amber-700' :
                      selectedWorkLog.status === 'confirmed' ? 'status-badge-approved' :
                      'status-badge-rejected'
                    }`}>
                      {getStatusIcon(selectedWorkLog.status)}
                      <span className="ml-1">{WORK_LOG_STATUS_TEXT[selectedWorkLog.status]}</span>
                    </span>
                  </div>
                  {selectedWorkLog.notes && (
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">备注</label>
                      <p className="text-base text-gray-900 mt-1">{selectedWorkLog.notes}</p>
                    </div>
                  )}
                </div>
                {selectedWorkLog.status === "submitted" && (
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openRejectModal(selectedWorkLog);
                      }}
                      className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
                    >
                      驳回
                    </button>
                    <button
                      onClick={() => {
                        handleConfirmWorkLog(selectedWorkLog._id);
                        setShowDetailModal(false);
                      }}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                    >
                      确认
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-md w-full shadow-xl animate-fade-in">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">驳回工时</h3>
                </div>
                <div className="p-6">
                  <label className="label">
                    驳回原因 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="请输入驳回原因..."
                    className="input-field"
                  />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setWorkLogToReject(null);
                      setRejectReason("");
                    }}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRejectWorkLog}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    确认驳回
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

export default HRWorkLogsPage;
