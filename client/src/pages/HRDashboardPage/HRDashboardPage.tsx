import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PlusIcon,
  UsersIcon,
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

const applicationStatusText: Record<string, string> = {
  pending: "待审核",
  accepted: "已通过",
  rejected: "已拒绝",
};

const HRDashboardPage = () => {
  const { user, activeRole } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingWorkLogs: 0,
    totalApplications: 0,
    monthlySpend: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [pendingWorkLogs, setPendingWorkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserName = () =>
    user?.first_name || user?.user_name || user?.email?.split("@")[0] || "用户";

  const getRoleLabel = () => {
    const roleType = activeRole?.role_type || user?.user_type_name;
    switch (roleType) {
      case "admin":
        return "管理员";
      case "hr_recruiter":
        return "HR 招聘官";
      default:
        return "求职者";
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [jobsRes, pendingRes, applicationsRes] = await Promise.all([
        jobsService.getMyPostedJobs().catch((error) => {
          console.error("[HRDashboard] Failed to load jobs:", error);
          return { data: [], jobs: [] };
        }),
        workLogService.getPendingWorkLogsForCompany().catch((error) => {
          console.error("[HRDashboard] Failed to load pending work logs:", error);
          return { work_logs: [], data: { work_logs: [] }, pagination: {} };
        }),
        jobsService.getApplicationsForMyJobs().catch((error) => {
          console.error("[HRDashboard] Failed to load applications:", error);
          return { data: [], applications: [] };
        }),
      ]);

      const jobsData = (jobsRes as any).data || (jobsRes as any).jobs || [];
      const activeJobs = jobsData.filter((job: any) => {
        const status = job.status?.toLowerCase() || "";
        return ["published", "in_progress", "active", "发布", "进行中"].includes(status);
      }).length;

      const pendingResponse = pendingRes as any;
      const pendingLogs = pendingResponse.work_logs || pendingResponse.data?.work_logs || [];
      const applicationsData = (applicationsRes as any).data || (applicationsRes as any).applications || [];

      setStats({
        activeJobs,
        pendingWorkLogs: pendingLogs.length,
        totalApplications: applicationsData.length,
        monthlySpend: 0,
      });
      setPendingWorkLogs(pendingLogs.slice(0, 5));
      setRecentApplications(applicationsData.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWorkLog = async (id: string) => {
    try {
      await workLogService.confirmWorkLog(id);
      loadDashboardData();
    } catch (error) {
      console.error("Failed to confirm work log:", error);
    }
  };

  const handleRejectWorkLog = async (id: string) => {
    const reason = prompt("请输入驳回原因");
    if (!reason) return;

    try {
      await workLogService.rejectWorkLog(id, reason);
      loadDashboardData();
    } catch (error) {
      console.error("Failed to reject work log:", error);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="工作台">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="工作台">
      <div className="space-y-6">
        <PageHeader
          title={`欢迎回来，${getUserName()}`}
          description={`你的角色是：${getRoleLabel()}`}
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "工作台" },
          ]}
          actions={
            <Link
              to="/post-job"
              data-testid="post-job-btn"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              发布新职位
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="有效职位"
            value={stats.activeJobs}
            icon={<BriefcaseIcon className="w-6 h-6 text-white" />}
            color="blue"
            link="/my-jobs"
          />
          <StatCard
            title="待审工时"
            value={stats.pendingWorkLogs}
            icon={<ClockIcon className="w-6 h-6 text-white" />}
            color="orange"
            link="/company/work-logs/pending"
          />
          <StatCard
            title="收到的申请"
            value={stats.totalApplications}
            icon={<UsersIcon className="w-6 h-6 text-white" />}
            color="purple"
            link="/company/applications"
          />
          <StatCard
            title="本月支出"
            value={`¥${stats.monthlySpend.toLocaleString()}`}
            icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">待审核工时</h2>
              <Link
                to="/company/work-logs/pending"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                查看全部
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingWorkLogs.length > 0 ? (
                pendingWorkLogs.map((log) => (
                  <div key={log._id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {log.freelancer_id?.display_name || log.freelancer_id?.freelancer_name || "顾问"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {log.project_requirement_id?.project_title || "项目名称"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.work_date).toLocaleDateString("zh-CN")} - {log.hours_worked}h
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleConfirmWorkLog(log._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="确认"
                          type="button"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectWorkLog(log._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="驳回"
                          type="button"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>暂无待审核工时</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">最近申请</h2>
              <Link
                to="/company/applications"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                查看全部
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div key={application._id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {application.freelancer_id?.display_name || "申请人"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {application.project_requirement_id?.project_title || "项目名称"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {application.applied_at
                            ? new Date(application.applied_at).toLocaleDateString("zh-CN")
                            : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {applicationStatusText[application.status] || application.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>暂无新申请</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <QuickActionsMenu title="快捷操作" maxItems={8} />
      </div>
    </PortalLayout>
  );
};

export default HRDashboardPage;
