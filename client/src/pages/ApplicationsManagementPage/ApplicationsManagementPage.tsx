import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import ApplicationsService from "@/services/applications.service";
import PageHeader from "@/components/core-ui/PageHeader";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  accepted: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const statusLabels: Record<string, string> = {
  pending: "待审核",
  reviewed: "已查看",
  accepted: "已录用",
  rejected: "已拒绝",
};

interface Application {
  _id: string;
  job_post_id: {
    _id: string;
    job_title?: string;
    job_description?: string;
  };
  user_id: {
    _id: string;
    user_name: string;
    email: string;
    user_image?: string;
  };
  status: string;
  apply_date: string;
  cover_letter?: string;
  resume_url?: string;
}

const ApplicationsManagementPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed" | "accepted" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await new ApplicationsService().getCompanyApplications({ limit: 100 });
      const apps = (response as any).applications || response.applications || [];
      setApplications(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("加载申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (activeTab !== "all") {
      result = result.filter((app) => app.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((app: any) => {
        const userName = app.user_id?.user_name?.toLowerCase() || "";
        const userEmail = app.user_id?.email?.toLowerCase() || "";
        const jobTitle = app.job_post_id?.job_title?.toLowerCase() || "";
        return userName.includes(query) || userEmail.includes(query) || jobTitle.includes(query);
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
  }), [applications]);

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      setProcessing(true);
      await new ApplicationsService().updateApplicationStatus(applicationId, newStatus);
      await fetchApplications();
      setShowDetailModal(false);
      setSelectedApplication(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("更新状态失败");
    } finally {
      setProcessing(false);
    }
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
      <div className="flex-1 max-w-5xl mx-auto w-full">
        <PageHeader
          title="项目申请管理"
          description="审核和管理顾问的项目申请"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "企业管理" },
            { label: "申请管理" },
          ]}
        />

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索申请人姓名、邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              {[
                { key: "all", label: "全部" },
                { key: "pending", label: "待审核" },
                { key: "reviewed", label: "已查看" },
                { key: "accepted", label: "已录用" },
                { key: "rejected", label: "已拒绝" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 py-4 px-1 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activeTab === tab.key
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusCounts[tab.key as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无申请记录</h3>
            <p className="text-gray-500">还没有顾问申请您的项目</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="applications-list">
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                data-testid={`application-item-${application._id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="rounded-full w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                        {application.user_id?.user_image ? (
                          <img
                            src={application.user_id.user_image}
                            alt={application.user_id.user_name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-8 w-8 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user_id?.user_name || "未知用户"}
                        </h3>
                        <p className="text-sm text-gray-500">{application.user_id?.email}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <BriefcaseIcon className="h-4 w-4" />
                          <span>
                            {application.job_post_id?.job_title || 
                             application.job_post_id?.job_description?.substring(0, 30) || 
                             "项目职位"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusColors[application.status]
                        }`}
                      >
                        {statusLabels[application.status] || application.status}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(application.apply_date).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleViewApplication(application)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      查看详情
                    </button>
                    {application.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(application._id, "reviewed")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          标记已查看
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(application._id, "accepted")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          录用
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(application._id, "rejected")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          拒绝
                        </button>
                      </>
                    )}
                    {application.status === "reviewed" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(application._id, "accepted")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          录用
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(application._id, "rejected")}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          拒绝
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowDetailModal(false)}></div>
              <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                    {selectedApplication.user_id?.user_image ? (
                      <img
                        src={selectedApplication.user_id.user_image}
                        alt={selectedApplication.user_id.user_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedApplication.user_id?.user_name}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedApplication.user_id?.email}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset mt-2 ${
                        statusColors[selectedApplication.status]
                      }`}
                    >
                      {statusLabels[selectedApplication.status] || selectedApplication.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请职位</h4>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedApplication.job_post_id?.job_title || 
                       selectedApplication.job_post_id?.job_description?.substring(0, 50) || 
                       "项目职位"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">申请时间</h4>
                    <p className="text-base text-gray-900">
                      {new Date(selectedApplication.apply_date).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {selectedApplication.cover_letter && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">求职信</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedApplication.cover_letter}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedApplication.resume_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">简历</h4>
                      <a
                        href={selectedApplication.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        查看简历
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    关闭
                  </button>
                  <div className="flex gap-2">
                    {selectedApplication.status !== "accepted" && selectedApplication.status !== "rejected" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedApplication._id, "accepted")}
                          disabled={processing}
                          className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          录用
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedApplication._id, "rejected")}
                          disabled={processing}
                          className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          拒绝
                        </button>
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
