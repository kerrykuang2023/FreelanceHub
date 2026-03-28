import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BellIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import workLogService from "@/services/worklogs.service";
import jobsService from "@/services/jobs.service";
import authService from "@/services/auth.service";
import { useAuth } from "@/providers";
import {
  IWorkLogSummary,
  WORK_LOG_STATUS_TEXT,
  WORK_LOG_STATUS_COLORS,
  WorkLogStatus,
} from "@/interfaces/models/worklog";
import StatCard from "@/components/core-ui/StatCard";
import { SkeletonCard } from "@/components/core-ui/Skeleton";
import PageHeader from "@/components/core-ui/PageHeader";
import QuickActionsMenu from "@/components/core-ui/QuickActionsMenu";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

interface IWorkLogSummaryExtended extends IWorkLogSummary {
  status_counts?: Record<string, number>;
}

const FreelancerDashboardPage = () => {
  const { user, activeRole } = useAuth();
  const [summary, setSummary] = useState<IWorkLogSummaryExtended | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingWorkLogs, setPendingWorkLogs] = useState<any[]>([]);

  const currentRoleType = activeRole?.role_type || user?.user_type_name || 'job_seeker';
  const isJobSeeker = currentRoleType === 'job_seeker';
  
  const getRoleLabel = () => {
    switch (currentRoleType) {
      case 'admin': return '管理员';
      case 'hr_recruiter': return 'HR招聘官';
      default: return '求职者';
    }
  };
  
  const getUserName = () => {
    return user?.first_name || user?.user_name || user?.email?.split('@')[0] || '用户';
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[FreelancerDashboard] Loading dashboard data...');
      
      const [summaryRes, projectsRes, applicationsRes, workLogsRes] = await Promise.all([
        workLogService.getWorkLogSummary().catch((err) => { 
          console.error('[FreelancerDashboard] Failed to load summary:', err);
          return { 
            total_hours: 0, 
            total_logs: 0, 
            by_status: [],
            status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0 }
          };
        }),
        jobsService.getMyProjects().catch((err) => {
          console.error('[FreelancerDashboard] Failed to load projects:', err);
          return { data: [] };
        }),
        jobsService.getMyApplications().catch((err) => {
          console.error('[FreelancerDashboard] Failed to load applications:', err);
          return { data: [], applications: [] };
        }),
        workLogService.getWorkLogs({ limit: 100 }).catch((err) => {
          console.error('[FreelancerDashboard] Failed to load work logs:', err);
          return { work_logs: [] };
        }),
      ]);

      console.log('[FreelancerDashboard] Summary response:', summaryRes);
      console.log('[FreelancerDashboard] Projects response:', projectsRes);
      console.log('[FreelancerDashboard] Applications response:', applicationsRes);

      const summaryData = (summaryRes as any) || { 
        total_hours: 0, 
        total_logs: 0, 
        by_status: [],
        status_counts: { draft: 0, submitted: 0, confirmed: 0, rejected: 0 }
      };
      setSummary(summaryData);

      const projectsData = (projectsRes as any).data || [];
      console.log('[FreelancerDashboard] Projects data:', projectsData);
      
      const myProjects = projectsData.filter(
        (p: any) => {
          const status = p.status?.toLowerCase() || '';
          return status === 'in_progress' || status === 'published' || 
                 status === '进行中' || status === '发布';
        }
      );
      console.log('[FreelancerDashboard] Filtered projects (in_progress/published):', myProjects.length);
      setProjects(myProjects.slice(0, 3));

      const applicationsData = (applicationsRes as any).data || (applicationsRes as any).applications || [];
      console.log('[FreelancerDashboard] Applications data:', applicationsData);
      
      const pending = applicationsData.filter(
        (a: any) => a.status === "pending" || a.status === "待审核"
      );
      setPendingWorkLogs(pending.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: WorkLogStatus): number => {
    if (summary?.status_counts && summary.status_counts[status] !== undefined) {
      return summary.status_counts[status];
    }
    if (!summary?.by_status) return 0;
    return summary.by_status.filter((s) => s.status === status).length || 0;
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
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PortalLayout title="工作台">
      <div className="space-y-6">
        <PageHeader
          title={`欢迎回来，${getUserName()}！`}
          description={`你的角色是：${getRoleLabel()}`}
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
          value={pendingWorkLogs.length}
          icon={<BellIcon className="w-6 h-6 text-white" />}
          color="orange"
          link="/applications"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">工时状态概览</h2>
            <Link
              to="/work-logs"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              查看全部
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {(["draft", "submitted", "confirmed", "rejected"] as const).map(
              (status) => {
                const count = getStatusCount(status);
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      {status === "draft" && (
                        <ExclamationCircleIcon className="w-5 h-5 text-gray-400 mr-3" />
                      )}
                      {status === "submitted" && (
                        <ClockIcon className="w-5 h-5 text-yellow-500 mr-3" />
                      )}
                      {status === "confirmed" && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                      )}
                      {status === "rejected" && (
                        <XCircleIcon className="w-5 h-5 text-red-500 mr-3" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {WORK_LOG_STATUS_TEXT[status]}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${WORK_LOG_STATUS_COLORS[status]}`}
                    >
                      {count} 条
                    </span>
                  </div>
                );
              }
            )}
            {summary?.total_logs === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>暂无工时记录</p>
                <Link
                  to="/work-logs/new"
                  className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700"
                >
                  开始填报工时
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">进行中的项目</h2>
            <Link
              to="/my-projects"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              查看全部
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project._id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {project.project_title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.company_name || "公司名称"}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      进行中
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BriefcaseIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>暂无进行中的项目</p>
                <Link
                  to="/jobs"
                  className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700"
                >
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
