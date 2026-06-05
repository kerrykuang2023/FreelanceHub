import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import ApplicationsService from "@/services/applications.service";
import JobsService from "@/services/jobs.service";
import { useAuth } from "@/providers";
import { IApplication } from "@/interfaces/models/users";
import PageHeader from "@/components/core-ui/PageHeader";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  accepted: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  published: "bg-green-50 text-green-700 ring-green-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
  draft: "bg-gray-50 text-gray-700 ring-gray-600/20",
  closed: "bg-red-50 text-red-700 ring-red-600/20",
};

const statusLabels: Record<string, string> = {
  pending: "待审核",
  reviewed: "已查看",
  accepted: "已录用",
  rejected: "已拒绝",
  published: "已发布",
  in_progress: "进行中",
  draft: "草稿",
  closed: "已关闭",
};

const MyJobsPage = () => {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed" | "accepted" | "rejected" | "published" | "in_progress">("all");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobType: "",
    location: "",
    dateRange: "",
    salaryMin: "",
    salaryMax: "",
  });

  const isHR = activeRole?.role_type === "hr_recruiter" || activeRole?.role_type === "admin";

  useEffect(() => {
    if (isHR) {
      fetchPostedJobs();
    } else {
      fetchApplications();
    }
  }, [isHR]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await new ApplicationsService().getUserApplications({ limit: 100 });
      const apps = (response as any).applications || response.applications || [];
      setApplications(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("加载申请列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchPostedJobs = async () => {
    try {
      setLoading(true);
      const response = await JobsService.getMyPostedJobs({ limit: 100 });
      const jobs = (response as any).jobs || (response as any).data || [];
      setPostedJobs(Array.isArray(jobs) ? jobs : []);
    } catch (err) {
      console.error("Failed to fetch posted jobs:", err);
      setError("加载项目列表失败");
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
        const jobDesc = app.job_post_id?.job_description?.toLowerCase() || "";
        const companyName = app.job_post_id?.company_id?.company_name?.toLowerCase() || "";
        const jobTitle = app.job_post_id?.job_title?.toLowerCase() || "";
        return jobDesc.includes(query) || companyName.includes(query) || jobTitle.includes(query);
      });
    }

    return result;
  }, [applications, activeTab, searchQuery]);

  const filteredJobs = useMemo(() => {
    let result = postedJobs;

    if (activeTab !== "all") {
      result = result.filter((job: any) => job.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((job: any) => {
        const title = job.job_title?.toLowerCase() || "";
        const desc = job.job_description?.toLowerCase() || "";
        return title.includes(query) || desc.includes(query);
      });
    }

    return result;
  }, [postedJobs, activeTab, searchQuery]);

  const applicationStatusCounts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }), [applications]);

  const jobStatusCounts = useMemo(() => ({
    all: postedJobs.length,
    published: postedJobs.filter((j: any) => j.status === "published").length,
    in_progress: postedJobs.filter((j: any) => j.status === "in_progress").length,
    draft: postedJobs.filter((j: any) => j.status === "draft").length,
    closed: postedJobs.filter((j: any) => j.status === "closed").length,
  }), [postedJobs]);

  const clearFilters = () => {
    setFilters({
      jobType: "",
      location: "",
      dateRange: "",
      salaryMin: "",
      salaryMax: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters = searchQuery || filters.jobType || filters.location || filters.dateRange;

  if (loading) {
    return (
      <PortalLayout title={isHR ? "我的项目" : "我的申请"}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  const renderHRView = () => (
    <>
      <PageHeader
        title="我发布的项目"
        description="管理您发布的所有项目"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "我的项目" },
        ]}
        actions={
          <button
            onClick={() => navigate("/post-job")}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            data-testid="post-new-job-btn"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            发布新项目
          </button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {[
              { key: "all", label: "全部" },
              { key: "published", label: "已发布" },
              { key: "in_progress", label: "进行中" },
              { key: "draft", label: "草稿" },
              { key: "closed", label: "已关闭" },
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
                  {jobStatusCounts[tab.key as keyof typeof jobStatusCounts]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? "没有匹配的结果" : "暂无发布的项目"}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters
              ? "尝试调整筛选条件查看更多结果"
              : "发布您的第一个项目，开始寻找合适的顾问"}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate("/post-job")}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              发布项目
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job: any) => (
            <div
              key={job._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/jobs/${job._id}`)}
              data-testid={`posted-job-item-${job._id}`}
            >
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="rounded-lg w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {job.job_title || "项目职位"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>{job.company_id?.company_name || "公司"}</span>
                      </div>
                      {job.rate_min && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span>
                            ¥{job.rate_min?.toLocaleString()}
                            {job.rate_max && ` - ¥${job.rate_max?.toLocaleString()}`}
                            /{job.rate_type === "daily" ? "天" : "小时"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusColors[job.status] || statusColors.draft
                    }`}
                  >
                    {statusLabels[job.status] || job.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      发布时间:{" "}
                      {new Date(job.created_date || job.createdAt).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UsersIcon className="h-4 w-4" />
                    <span>{job.applications_count || 0} 个申请</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderFreelancerView = () => (
    <>
      <PageHeader
        title="我的项目申请"
        description="跟踪和管理您的项目申请"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "我的申请" },
        ]}
        actions={
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <BriefcaseIcon className="w-5 h-5 mr-2" />
            浏览新项目
          </button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目名称、公司..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm ${
                showFilters || hasActiveFilters
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              筛选
            </button>
          </div>
        </div>

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
                  {applicationStatusCounts[tab.key as keyof typeof applicationStatusCounts]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? "没有匹配的结果" : "暂无申请记录"}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters
              ? "尝试调整筛选条件查看更多结果"
              : "开始申请项目，您的申请将显示在这里"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            浏览项目
          </button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="applications-list">
          {filteredApplications.map((application: any) => (
            <div
              key={application._id}
              data-testid={`application-item-${application._id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/jobs/${application.job_post_id?._id}`)}
            >
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="rounded-lg w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {application.job_post_id?.job_title || "项目职位"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>{application.job_post_id?.company_id?.company_name || "公司"}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusColors[application.status]
                    }`}
                  >
                    {statusLabels[application.status] || application.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      申请时间:{" "}
                      {new Date(application.apply_date).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <PortalLayout title={isHR ? "我的项目" : "我的申请"}>
      <div className="w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {isHR ? renderHRView() : renderFreelancerView()}
      </div>
    </PortalLayout>
  );
};

export default MyJobsPage;
