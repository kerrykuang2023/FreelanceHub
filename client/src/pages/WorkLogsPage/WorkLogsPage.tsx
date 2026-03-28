import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import workLogService from "@/services/worklogs.service";
import {
  IWorkLog,
  WORK_LOG_STATUS_TEXT,
  WORK_LOG_STATUS_COLORS,
  WorkLogStatus,
} from "@/interfaces/models/worklog";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

const WorkLogsPage = () => {
  const navigate = useNavigate();
  const [workLogs, setWorkLogs] = useState<IWorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });
  const [filter, setFilter] = useState<{
    status?: WorkLogStatus;
    project_id?: string;
  }>({});
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<IWorkLog | null>(null);
  const [editForm, setEditForm] = useState({
    work_date: "",
    hours_worked: 0,
    work_type: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkLogs();
  }, [pagination.current_page, filter]);

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await workLogService.getWorkLogs({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filter,
      });
      setWorkLogs(response.work_logs || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === workLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(workLogs.map((log) => log._id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedLogs.includes(id)) {
      setSelectedLogs(selectedLogs.filter((logId) => logId !== id));
    } else {
      setSelectedLogs([...selectedLogs, id]);
    }
  };

  const handleBatchSubmit = async () => {
    if (selectedLogs.length === 0) return;
    try {
      setSubmitting(true);
      await workLogService.batchSubmitWorkLogs(selectedLogs);
      setSelectedLogs([]);
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to batch submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSingle = async (id: string) => {
    try {
      setSubmitting(true);
      await workLogService.submitWorkLog(id);
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to submit work log:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (log: IWorkLog) => {
    setSelectedWorkLog(log);
    setShowDetailModal(true);
  };

  const handleEdit = (log: IWorkLog) => {
    setSelectedWorkLog(log);
    setEditForm({
      work_date: log.work_date?.split("T")[0] || "",
      hours_worked: log.hours_worked,
      work_type: log.work_type || "",
      description: log.description || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (log: IWorkLog) => {
    setSelectedWorkLog(log);
    setShowDeleteModal(true);
  };

  const handleUpdateWorkLog = async () => {
    if (!selectedWorkLog) return;
    try {
      setSubmitting(true);
      await workLogService.updateWorkLog(selectedWorkLog._id, editForm);
      setShowEditModal(false);
      setSelectedWorkLog(null);
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to update work log:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkLog) return;
    try {
      setSubmitting(true);
      await workLogService.deleteWorkLog(selectedWorkLog._id);
      setShowDeleteModal(false);
      setSelectedWorkLog(null);
      loadWorkLogs();
    } catch (error) {
      console.error("Failed to delete work log:", error);
    } finally {
      setSubmitting(false);
    }
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
    <PortalLayout title="工时管理">
      <div className="space-y-6">
        <PageHeader
          title="工时管理"
          description="管理你的工时记录"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "工时管理" },
          ]}
          actions={
            <Link
              to="/work-logs/new"
              data-testid="create-worklog-btn"
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              填报工时
            </Link>
          }
        />

        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                data-testid="status-filter"
                value={filter.status || ""}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value as WorkLogStatus || undefined })
                }
                className="input-field w-auto"
              >
                <option value="">所有状态</option>
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="confirmed">已确认</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            {selectedLogs.length > 0 && (
              <button
                onClick={handleBatchSubmit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "提交中..." : `批量提交 (${selectedLogs.length})`}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : workLogs.length === 0 ? (
            <div className="text-center py-16">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无工时记录</h3>
              <p className="text-sm text-gray-500 mb-6">开始填报你的第一条工时</p>
              <Link
                to="/work-logs/new"
                className="btn-primary inline-flex"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                填报工时
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLogs.length === workLogs.length && workLogs.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        项目
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        工时
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200" data-testid="worklogs-tbody">
                    {workLogs.map((log) => (
                      <tr key={log._id} data-testid={`worklog-row-${log._id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          {(log.status === "draft" || log.status === "rejected") && (
                            <input
                              type="checkbox"
                              checked={selectedLogs.includes(log._id)}
                              onChange={() => handleSelect(log._id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {new Date(log.work_date).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.project_requirement_id?.project_title || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{log.hours_worked}h</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.work_type}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${
                            log.status === 'draft' ? 'status-badge-pending' :
                            log.status === 'submitted' ? 'bg-amber-50 text-amber-700' :
                            log.status === 'confirmed' ? 'status-badge-approved' :
                            'status-badge-rejected'
                          }`}>
                            {getStatusIcon(log.status)}
                            <span className="ml-1">{WORK_LOG_STATUS_TEXT[log.status]}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(log)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {(log.status === "draft" || log.status === "rejected") && (
                              <>
                                <button
                                  onClick={() => handleEdit(log)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="编辑"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(log)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="删除"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSubmitSingle(log._id)}
                                  disabled={submitting}
                                  className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  提交
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

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  共 {pagination.total_items} 条记录，第 {pagination.current_page}/{pagination.total_pages} 页
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, current_page: pagination.current_page - 1 })
                    }
                    disabled={pagination.current_page === 1}
                    className="btn-secondary"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, current_page: pagination.current_page + 1 })
                    }
                    disabled={pagination.current_page === pagination.total_pages}
                    className="btn-secondary"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedWorkLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">工时详情</h3>
                  <button 
                    onClick={() => setShowDetailModal(false)} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">日期</label>
                    <p className="text-base text-gray-900 mt-1 font-medium">
                      {new Date(selectedWorkLog.work_date).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">项目</label>
                    <p className="text-base text-gray-900 mt-1 font-medium">
                      {selectedWorkLog.project_requirement_id?.project_title || "-"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">工时</label>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkLog.hours_worked} 小时</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">类型</label>
                      <p className="text-base text-gray-900 mt-1">{selectedWorkLog.work_type}</p>
                    </div>
                  </div>
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
                  {selectedWorkLog.description && (
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">描述</label>
                      <p className="text-base text-gray-900 mt-1">{selectedWorkLog.description}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="btn-secondary"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedWorkLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">编辑工时</h3>
                  <button 
                    onClick={() => setShowEditModal(false)} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateWorkLog(); }} className="space-y-4">
                  <div>
                    <label className="label">日期</label>
                    <input
                      type="date"
                      value={editForm.work_date}
                      onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">工时 (小时)</label>
                    <input
                      type="number"
                      value={editForm.hours_worked}
                      onChange={(e) => setEditForm({ ...editForm, hours_worked: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                      min="0.5"
                      max="24"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="label">工作类型</label>
                    <input
                      type="text"
                      value={editForm.work_type}
                      onChange={(e) => setEditForm({ ...editForm, work_type: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">描述</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? "保存中..." : "保存"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedWorkLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                    <TrashIcon className="h-7 w-7 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">确认删除</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    确定要删除这条工时记录吗？此操作无法撤销。
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={submitting}
                      className="px-4 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "删除中..." : "确认删除"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default WorkLogsPage;
