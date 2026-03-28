import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import workLogService from "@/services/worklogs.service";
import jobsService from "@/services/jobs.service";
import { useAuth } from "@/providers";
import StatCard from "@/components/core-ui/StatCard";
import { SkeletonCard } from "@/components/core-ui/Skeleton";
import PageHeader from "@/components/core-ui/PageHeader";
import QuickActionsMenu from "@/components/core-ui/QuickActionsMenu";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

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

  const getUserName = () => {
    return user?.first_name || user?.user_name || user?.email?.split('@')[0] || '用户';
  };

  const getRoleLabel = () => {
    const roleType = activeRole?.role_type || user?.user_type_name;
    switch (roleType) {
      case 'admin': return '管理员';
      case 'hr_recruiter': return 'HR招聘官';
      default: return '求职者';
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[HRDashboard] Loading dashboard data...');
      
      const [jobsRes, pendingRes, applicationsRes] = await Promise.all([
        jobsService.getMyPostedJobs().catch((err) => {
          console.error('[HRDashboard] Failed to load jobs:', err);
          return { data: [], jobs: [] };
        }),
        workLogService.getPendingWorkLogsForCompany().catch((err) => {
          console.error('[HRDashboard] Failed to load pending work logs:', err);
          return { work_logs: [], data: { work_logs: [] }, pagination: {} };
        }),
        jobsService.getApplicationsForMyJobs().catch((err) => {
          console.error('[HRDashboard] Failed to load applications:', err);
          return { data: [], applications: [] };
        }),
      ]);

      console.log('[HRDashboard] Jobs response:', jobsRes);
      console.log('[HRDashboard] Pending work logs response:', pendingRes);
      console.log('[HRDashboard] Applications response:', applicationsRes);

      const jobsData = (jobsRes as any).data || (jobsRes as any).jobs || [];
      console.log('[HRDashboard] Jobs data:', jobsData);
      
      const activeJobs = jobsData.filter(
        (j: any) => {
          const status = j.status?.toLowerCase() || '';
          return status === '发布' || status === 'published' || status === '进行中' || status === 'in_progress' || status === 'active';
        }
      ).length;
      console.log('[HRDashboard] Active jobs count:', activeJobs);

      const pendingResponse = pendingRes as any;
      const pendingLogs = pendingResponse.work_logs || pendingResponse.data?.work_logs || [];
      console.log('[HRDashboard] Pending work logs:', pendingLogs.length);

      const applicationsData = (applicationsRes as any).data || (applicationsRes as any).applications || [];
      console.log('[HRDashboard] Applications data:', applicationsData);

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
    const reason = prompt("请输入驳回原因:");
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
          link="/my-posted-jobs"
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
          link="/applications/received"
        />
        <StatCard
          title="本月支出"
          value={`¥${stats.monthlySpend.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                <div
                  key={log._id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {log.freelancer_id?.display_name || "顾问"}
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
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectWorkLog(log._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="驳回"
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近申请</h2>
            <Link
              to="/applications/received"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              查看全部
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.map((app) => (
                <div
                  key={app._id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {app.freelancer_id?.display_name || "申请人"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {app.project_requirement_id?.project_title || "项目名称"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(app.applied_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : app.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {app.status === "pending" ? "待审核" : app.status === "accepted" ? "已通过" : "已拒绝"}
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
        </div>
      </div>

      <QuickActionsMenu title="快捷操作" maxItems={8} />
      </div>
    </PortalLayout>
  );
};

export default HRDashboardPage;
