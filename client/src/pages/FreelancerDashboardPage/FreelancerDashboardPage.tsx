import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BellIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "@/components/core-ui/PageHeader";
import QuickActionsMenu from "@/components/core-ui/QuickActionsMenu";
import { SkeletonCard } from "@/components/core-ui/Skeleton";
import StatCard from "@/components/core-ui/StatCard";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import { useAuth } from "@/providers";
import jobsService from "@/services/jobs.service";
import workLogService from "@/services/worklogs.service";
import { IWorkLogSummary, WorkLogStatus } from "@/interfaces/models/worklog";

interface IWorkLogSummaryExtended extends IWorkLogSummary {
  status_counts?: Record<string, number>;
}

interface DashboardProject {
  _id: string;
  project_title: string;
  company_name: string;
  status: string;
  application_status?: string;
}

const STATUS_META: Record<"draft" | "submitted" | "confirmed" | "rejected", {
  label: string;
  color: string;
  icon: typeof ExclamationCircleIcon;
}> = {
  draft: {
    label: "草稿",
    color: "bg-gray-100 text-gray-800",
    icon: ExclamationCircleIcon,
  },
  submitted: {
    label: "已提交",
    color: "bg-yellow-100 text-yellow-800",
    icon: ClockIcon,
  },
  confirmed: {
    label: "已确认",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  rejected: {
    label: "已驳回",
    color: "bg-red-100 text-red-800",
    icon: XCircleIcon,
  },
};

const getProjectId = (project: any) =>
  (project?._id || project?.id || project?.job_post_id?._id || project?.job_post_id || "").toString();

const getProjectTitle = (project: any) =>
  project?.project_title ||
  project?.job_title ||
  project?.title ||
  project?.job_description?.slice?.(0, 80) ||
  "未命名项目";

const getProjectCompanyName = (project: any) =>
  project?.company_name ||
  project?.company_id?.company_name ||
  project?.job_post_id?.company_id?.company_name ||
  "未填写公司";

const normalizeProject = (project: any, applicationStatus?: string): DashboardProject | null => {
  const id = getProjectId(project);
  if (!id) return null;

  return {
    _id: id,
    project_title: getProjectTitle(project),
    company_name: getProjectCompanyName(project),
    status: (project?.status || project?.job_post_id?.status || "").toString(),
    application_status: applicationStatus,
  };
};

const isOngoingProject = (project: DashboardProject) => {
  const status = project.status.toLowerCase();
  return (
    project.application_status === "accepted" ||
    status === "in_progress" ||
    status === "published" ||
    status === "进行中" ||
    status === "发布"
  );
};

const FreelancerDashboardPage = () => {
  const { user, activeRole } = useAuth();
  const [summary, setSummary] = useState<IWorkLogSummaryExtended | null>(null);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentRoleType = activeRole?.role_type || user?.user_type_name || "job_seeker";
  const isJobSeeker = currentRoleType === "job_seeker" || currentRoleType === "freelancer";

  const roleLabel = useMemo(() => {
    switch (currentRoleType) {
      case "admin":
        return "平台管理员";
      case "hr_recruiter":
        return "HR 招聘官";
      default:
        return "求职者";
    }
  }, [currentRoleType]);

  const userName = user?.first_name || user?.user_name || user?.email?.split("@")[0] || "用户";

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [summaryRes, projectsRes, applicationsRes] = await Promise.all([
        workLogService.getWorkLogSummary().catch(() => ({
          total_hours: 0,
          total_logs: 0,
          by_status: [],
          status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0 },
        })),
        jobsService.getMyProjects({ limit: 100 }).catch(() => ({ data: [] })),
        jobsService.getMyApplications({ limit: 100 }).catch(() => ({ data: [], applications: [] })),
      ]);

      const summaryData = (summaryRes as any) || {
        total_hours: 0,
        total_logs: 0,
        by_status: [],
        status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0 },
      };
      setSummary(summaryData);

      const applicationsData = (applicationsRes as any).data || (applicationsRes as any).applications || [];
      const normalizedById = new Map<string, DashboardProject>();

      ((projectsRes as any).data || [])
        .map((project: any) => normalizeProject(project))
        .filter(Boolean)
        .forEach((project: any) => normalizedById.set(project._id, project));

      applicationsData
        .filter((application: any) => application.status === "accepted")
        .map((application: any) => normalizeProject(application.job_post_id || application, application.status))
        .filter(Boolean)
        .forEach((project: any) => normalizedById.set(project._id, project));

      const ongoingProjects = Array.from(normalizedById.values()).filter(isOngoingProject);
      setProjects(ongoingProjects.slice(0, 3));

      setPendingApplications(
        applicationsData
          .filter((application: any) => application.status === "pending")
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Failed to load freelancer dashboard data:", error);
      setSummary({
        total_hours: 0,
        total_logs: 0,
        by_status: [],
        status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0 },
      } as IWorkLogSummaryExtended);
      setProjects([]);
      setPendingApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: WorkLogStatus): number => {
    if (summary?.status_counts && summary.status_counts[status] !== undefined) {
      return summary.status_counts[status];
    }
    if (!summary?.by_status) return 0;
    return summary.by_status.filter((item) => item.status === status).length || 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PortalLayout title="工作台">
      <div className="space-y-6">
        <PageHeader
          title={`欢迎回来，${userName}！`}
          description={`你的角色是：${roleLabel}`}
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "工作台" },
          ]}
          actions={
            isJobSeeker ? (
              <Link
                to="/work-logs/new"
                data-testid="quick-log-work-btn"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                快速填报工时
              </Link>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="本周工时"
            value={`${summary?.total_hours || 0}h`}
            icon={<ClockIcon className="w-6 h-6 text-white" />}
            color="blue"
            link="/work-logs"
          />
          <StatCard
            title="进行中项目"
            value={projects.length}
            icon={<BriefcaseIcon className="w-6 h-6 text-white" />}
            color="purple"
            link="/my-projects"
          />
          <StatCard
            title="待收款"
            value="¥0"
            icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
            color="green"
            link="/payments"
          />
          <StatCard
            title="待审核申请"
            value={pendingApplications.length}
            icon={<BellIcon className="w-6 h-6 text-white" />}
            color="orange"
            link="/applications"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">工时状态概览</h2>
              <Link to="/work-logs" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                查看全部
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {(["draft", "submitted", "confirmed", "rejected"] as const).map((status) => {
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                const count = getStatusCount(status);

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                      {count} 条
                    </span>
                  </div>
                );
              })}

              {summary?.total_logs === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>暂无工时记录</p>
                  <Link to="/work-logs/new" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
                    开始填报工时
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">进行中的项目</h2>
              <Link to="/my-projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                查看全部
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3" data-testid="ongoing-projects-list">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project._id}
                    data-testid="ongoing-project-card"
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{project.project_title}</h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">{project.company_name}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full shrink-0">
                        进行中
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BriefcaseIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>暂无进行中的项目</p>
                  <Link to="/jobs" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
                    浏览项目
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <QuickActionsMenu title="快捷操作" maxItems={8} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近消息</h2>
          <div className="text-center py-8 text-gray-500">
            <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>暂无新消息</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FreelancerDashboardPage;
