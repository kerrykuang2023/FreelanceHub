import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import ApplicationsService from "@/services/applications.service";
import PageHeader from "@/components/core-ui/PageHeader";

type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected" | "invalidated";

interface Applicant {
  _id: string;
  user_name?: string;
  email?: string;
  user_image?: string;
}

interface Application {
  _id: string;
  job_post_id?: {
    _id: string;
    job_title?: string;
    project_title?: string;
    job_description?: string;
    status?: string;
  };
  user_id?: Applicant;
  user_account_id?: Applicant;
  status: ApplicationStatus;
  apply_date?: string;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  accepted: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  invalidated: "bg-gray-100 text-gray-600 ring-gray-400/20",
};

const statusLabels: Record<string, string> = {
  pending: "待审核",
  reviewed: "已查看",
  accepted: "已录用",
  rejected: "已拒绝",
  invalidated: "已失效",
};

const tabOptions: Array<{ key: "all" | ApplicationStatus; label: string }> = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待审核" },
  { key: "reviewed", label: "已查看" },
  { key: "accepted", label: "已录用" },
  { key: "rejected", label: "已拒绝" },
];

const getApiErrorMessage = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  return fallback;
};

const getStatusActionLabel = (status: string) => {
  const labels: Record<string, string> = {
    reviewed: "标记已查看",
    accepted: "录用",
    rejected: "拒绝",
  };
  return labels[status] || "更新状态";
};

const ApplicationsManagementPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | ApplicationStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await new ApplicationsService().getCompanyApplications({ limit: 100 });
      const apps = (response as any).applications || [];
      setApplications(apps);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError(getApiErrorMessage(err, "加载申请列表失败，请刷新后重试。"));
    } finally {
      setLoading(false);
    }
  };

  const getApplicant = (application: Application) => application.user_id || application.user_account_id;

  const getApplicantName = (application: Application) => {
    const applicant = getApplicant(application);
    return applicant?.user_name || applicant?.email || "未提供姓名";
  };

  const getApplicantEmail = (application: Application) => getApplicant(application)?.email || "-";

  const getJobTitle = (application: Application) =>
    application.job_post_id?.job_title ||
    application.job_post_id?.project_title ||
    application.job_post_id?.job_description?.substring(0, 30) ||
    "未命名项目";

  const formatDate = (date?: string, long = false) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("zh-CN", long ? {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    } : undefined);
  };

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (activeTab !== "all") {
      result = result.filter((app) => app.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((app) => {
        return (
          getApplicantName(app).toLowerCase().includes(query) ||
          getApplicantEmail(app).toLowerCase().includes(query) ||
          getJobTitle(app).toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [applications, activeTab, searchQuery]);

  const statusCounts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    invalidated: applications.filter((a) => a.status === "invalidated").length,
  }), [applications]);

  const handleUpdateStatus = async (application: Application, newStatus: ApplicationStatus) => {
    try {
      setProcessingApplicationId(application._id);
      setError(null);
      setSuccessMessage(null);

      await new ApplicationsService().updateApplicationStatus(application._id, newStatus);
      await fetchApplications();
      setSelectedApplication(null);
      setSuccessMessage(`已${getStatusActionLabel(newStatus)}：${getApplicantName(application)} - ${getJobTitle(application)}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      const reason = getApiErrorMessage(err, "更新状态失败，请稍后重试。");
      setError(`更新状态失败：${reason}`);
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const renderActionButton = (application: Application, status: ApplicationStatus, className: string) => {
    const isProcessing = processingApplicationId === application._id;
    return (
      <button
        type="button"
        onClick={() => handleUpdateStatus(application, status)}
        disabled={Boolean(processingApplicationId)}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        data-testid={`application-${status}-button`}
      >
        {status === "accepted" && <CheckCircleIcon className="h-4 w-4 mr-2" />}
        {status === "rejected" && <XCircleIcon className="h-4 w-4 mr-2" />}
        {status === "reviewed" && <EyeIcon className="h-4 w-4 mr-2" />}
        {isProcessing ? "处理中..." : getStatusActionLabel(status)}
      </button>
    );
  };

  if (loading) {
    return (
      <PortalLayout title="申请管理">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="申请管理">
      <div className="w-full space-y-6">
        <PageHeader
          title="项目申请管理"
          description="审核和管理顾问提交的项目申请"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "企业管理" },
            { label: "申请管理" },
          ]}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索申请人姓名、邮箱或项目..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200">
            <nav className="flex -mb-px" aria-label="申请状态">
              {tabOptions.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-4 px-1 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    activeTab === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {statusCounts[tab.key]}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="application-success-message">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="application-error-message">
            <p className="text-red-700 text-sm">{error}</p>
            <p className="mt-1 text-xs text-red-600">
              请确认该申请仍处于可处理状态，且项目属于当前企业；如问题仍存在，请刷新列表后重试。
            </p>
          </div>
        )}

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无申请记录</h3>
            <p className="text-gray-500">当前筛选条件下还没有顾问申请。</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="applications-list">
            {filteredApplications.map((application) => {
              const applicant = getApplicant(application);
              const canProcess = application.status === "pending" || application.status === "reviewed";

              return (
                <div
                  key={application._id}
                  data-testid={`application-item-${application._id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="rounded-full w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                          {applicant?.user_image ? (
                            <img src={applicant.user_image} alt={getApplicantName(application)} className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <UserCircleIcon className="h-8 w-8 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{getApplicantName(application)}</h3>
                          <p className="text-sm text-gray-500">{getApplicantEmail(application)}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <BriefcaseIcon className="h-4 w-4" />
                            <span>{getJobTitle(application)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[application.status] || statusColors.pending}`}>
                          {statusLabels[application.status] || application.status}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(application.apply_date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setSelectedApplication(application)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        查看详情
                      </button>
                      {application.status === "pending" && renderActionButton(application, "reviewed", "text-gray-600 bg-gray-100 hover:bg-gray-200")}
                      {canProcess && renderActionButton(application, "accepted", "text-green-700 bg-green-50 hover:bg-green-100")}
                      {canProcess && renderActionButton(application, "rejected", "text-red-700 bg-red-50 hover:bg-red-100")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <button
                type="button"
                aria-label="关闭详情"
                className="fixed inset-0 bg-black opacity-30"
                onClick={() => setSelectedApplication(null)}
              />
              <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{getApplicantName(selectedApplication)}</h3>
                    <p className="text-sm text-gray-500">{getApplicantEmail(selectedApplication)}</p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset mt-2 ${statusColors[selectedApplication.status] || statusColors.pending}`}>
                      {statusLabels[selectedApplication.status] || selectedApplication.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请项目</h4>
                    <p className="text-base font-semibold text-gray-900">{getJobTitle(selectedApplication)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请时间</h4>
                    <p className="text-base text-gray-900">{formatDate(selectedApplication.apply_date, true)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">申请说明</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.cover_letter || "申请人暂未填写说明。"}
                      </p>
                    </div>
                  </div>
                  {selectedApplication.resume_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">简历</h4>
                      <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        查看简历
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    关闭
                  </button>
                  <div className="flex gap-2">
                    {(selectedApplication.status === "pending" || selectedApplication.status === "reviewed") && (
                      <>
                        {renderActionButton(selectedApplication, "accepted", "text-white bg-green-600 hover:bg-green-700")}
                        {renderActionButton(selectedApplication, "rejected", "text-white bg-red-600 hover:bg-red-700")}
                      </>
                    )}
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

export default ApplicationsManagementPage;
