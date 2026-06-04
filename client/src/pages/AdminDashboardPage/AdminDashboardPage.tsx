import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  PuzzlePieceIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import adminService, { ICompany, IWorkLog, IInvoice, IProject, IDashboardStats } from "@/services/admin.service";
import StatCard from "@/components/core-ui/StatCard";
import { SkeletonCard } from "@/components/core-ui/Skeleton";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

type TabType = "overview" | "companies" | "worklogs" | "invoices" | "projects" | "financial";

interface FinancialSummary {
  totalAmount: number;
  totalTaxAmount: number;
  invoiceCount: number;
  statusBreakdown: Record<string, number>;
}

const AdminDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [workLogs, setWorkLogs] = useState<IWorkLog[]>([]);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [companyFilter, setCompanyFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [workLogFilter, setWorkLogFilter] = useState<string>("all");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab") as TabType | null;
    const supportedTabs: TabType[] = ["overview", "companies", "worklogs", "invoices", "projects", "financial"];
    if (requestedTab && supportedTabs.includes(requestedTab)) {
      setActiveTab(requestedTab);
    } else if (!requestedTab) {
      setActiveTab("overview");
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === "companies") {
      loadCompanies();
    } else if (activeTab === "worklogs") {
      loadWorkLogs();
    } else if (activeTab === "invoices") {
      loadInvoices();
    } else if (activeTab === "projects") {
      loadProjects();
    } else if (activeTab === "financial") {
      loadFinancialSummary();
    }
  }, [activeTab, companyFilter, workLogFilter, invoiceFilter, pagination.page]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPagination({ ...pagination, page: 1 });
    if (tab === "overview") {
      navigate("/admin/dashboard");
      return;
    }
    navigate(`/admin?tab=${tab}`);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      const data = response as any;
      if (data && data.stats) {
        setStats(data.stats);
      } else if (data && data.data && data.data.stats) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const status = companyFilter === "all" ? undefined : companyFilter;
      const response = await adminService.getCompanies({ page: pagination.page, limit: pagination.limit, status });
      const data = response as any;
      if (data && data.data) {
        setCompanies(data.data);
      } else if (Array.isArray(data)) {
        setCompanies(data);
      }
      if (data && data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const status = workLogFilter === "all" ? undefined : workLogFilter;
      const response = await adminService.getWorkLogs({ page: pagination.page, limit: pagination.limit, status });
      const data = response as any;
      if (data && data.data) {
        setWorkLogs(data.data);
      } else if (Array.isArray(data)) {
        setWorkLogs(data);
      }
      if (data && data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const status = invoiceFilter === "all" ? undefined : invoiceFilter;
      const response = await adminService.getInvoices({ page: pagination.page, limit: pagination.limit, status });
      const data = response as any;
      if (data && data.data) {
        setInvoices(data.data);
      } else if (Array.isArray(data)) {
        setInvoices(data);
      }
      if (data && data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await adminService.getProjects({ page: pagination.page, limit: pagination.limit });
      const data = response as any;
      if (data && data.data) {
        setProjects(data.data);
      } else if (Array.isArray(data)) {
        setProjects(data);
      }
      if (data && data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFinancialSummary();
      const data = response as any;
      setFinancialSummary(data?.data?.data || data?.data || data || null);
    } catch (error) {
      console.error("Failed to load financial summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCompany = async (id: string, status: "approved" | "rejected") => {
    const reason = prompt(status === "approved" ? "通过原因(可选):" : "拒绝原因:");
    if (status === "rejected" && !reason?.trim()) {
      alert("拒绝原因不能为空");
      return;
    }
    try {
      await adminService.verifyCompany(id, status, reason ?? undefined);
      loadCompanies();
      loadDashboardData();
      alert(`企业已${status === "approved" ? "通过" : "拒绝"}审核`);
    } catch (error) {
      console.error("Failed to verify company:", error);
      alert("操作失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "待审核" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "已通过" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "已拒绝" },
      draft: { bg: "bg-gray-100", text: "text-gray-800", label: "草稿" },
      submitted: { bg: "bg-blue-100", text: "text-blue-800", label: "已提交" },
      confirmed: { bg: "bg-green-100", text: "text-green-800", label: "已确认" },
      invoiced: { bg: "bg-purple-100", text: "text-purple-800", label: "已开票" },
      paid: { bg: "bg-emerald-100", text: "text-emerald-800", label: "已支付" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "已取消" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          disabled={pagination.page <= 1}
          className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          上一页
        </button>
        <span className="px-3 py-1 text-sm">
          第 {pagination.page} / {pagination.pages || 1} 页
        </span>
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          disabled={pagination.page >= pagination.pages}
          className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          下一页
        </button>
      </div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PortalLayout title="系统管理">
      <div className="space-y-6">
        <PageHeader
          title="系统管理后台"
          description="管理用户、企业审核、工时发票和系统配置"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "系统管理" },
          ]}
        />

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "overview", label: "系统概览", icon: ChartBarIcon },
          { key: "companies", label: "企业审核", icon: BuildingOfficeIcon, badge: stats?.pendingCompanies },
          { key: "worklogs", label: "工时管理", icon: ClockIcon },
          { key: "invoices", label: "发票管理", icon: ReceiptPercentIcon, badge: stats?.pendingInvoices },
          { key: "projects", label: "项目管理", icon: PuzzlePieceIcon },
          { key: "financial", label: "财务统计", icon: DocumentChartBarIcon },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key as TabType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="总用户数"
              value={stats.totalUsers}
              icon={<UserGroupIcon className="w-6 h-6 text-white" />}
              color="blue"
              link="/admin/users"
            />
            <StatCard
              title="自由顾问"
              value={stats.totalFreelancers}
              icon={<PuzzlePieceIcon className="w-6 h-6 text-white" />}
              color="green"
            />
            <StatCard
              title="注册企业"
              value={stats.totalCompanies}
              icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />}
              color="purple"
            />
            <StatCard
              title="待处理发票"
              value={stats.pendingInvoices}
              icon={<ReceiptPercentIcon className="w-6 h-6 text-white" />}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="项目需求"
              value={stats.totalProjects}
              icon={<PuzzlePieceIcon className="w-6 h-6 text-white" />}
              color="blue"
            />
            <StatCard
              title="工时记录"
              value={stats.totalWorkLogs}
              icon={<ClockIcon className="w-6 h-6 text-white" />}
              color="green"
            />
            <StatCard
              title="发票总数"
              value={stats.totalInvoices}
              icon={<ReceiptPercentIcon className="w-6 h-6 text-white" />}
              color="purple"
            />
            <StatCard
              title="技能分类"
              value="配置"
              icon={<CpuChipIcon className="w-6 h-6 text-white" />}
              color="orange"
              link="/admin/config/skill-categories"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">快捷操作</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTabChange("companies")}
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <BuildingOfficeIcon className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">企业审核</span>
                  {stats.pendingCompanies > 0 && (
                    <span className="text-xs text-orange-600 mt-1">{stats.pendingCompanies} 待处理</span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange("worklogs")}
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <ClockIcon className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">工时管理</span>
                </button>
                <button
                  onClick={() => handleTabChange("invoices")}
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <ReceiptPercentIcon className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">发票管理</span>
                </button>
                <button
                  onClick={() => handleTabChange("financial")}
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <DocumentChartBarIcon className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">财务统计</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">系统状态</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">数据库连接</span>
                  </div>
                  <span className="text-sm text-green-600">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">API 服务</span>
                  </div>
                  <span className="text-sm text-green-600">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">邮件服务</span>
                  </div>
                  <span className="text-sm text-yellow-600">待配置</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "companies" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">企业审核管理</h2>
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setCompanyFilter(filter as typeof companyFilter);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    companyFilter === filter
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filter === "all" ? "全部" : filter === "pending" ? "待审核" : filter === "approved" ? "已通过" : "已拒绝"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="companies-tbody">
                {companies.map((company) => (
                  <tr key={company._id} data-testid={`company-row-${company._id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {company.profile_description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(company.verification_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(company.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/admin/companies/${company._id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        aria-label={`查看企业 ${company.company_name}`}
                      >
                        <EyeIcon className="w-5 h-5 inline" />
                      </Link>
                      {company.verification_status === "pending" && (
                        <>
                          <button
                            onClick={() => handleVerifyCompany(company._id, "approved")}
                            className="text-green-600 hover:text-green-900 mr-3 transition-colors"
                            title="通过"
                            aria-label={`通过企业 ${company.company_name}`}
                          >
                            <CheckCircleIcon className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleVerifyCompany(company._id, "rejected")}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="拒绝"
                            aria-label={`拒绝企业 ${company.company_name}`}
                          >
                            <XCircleIcon className="w-5 h-5 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      暂无企业数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {activeTab === "worklogs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">工时记录管理</h2>
            <div className="flex gap-2">
              <select
                value={workLogFilter}
                onChange={(e) => {
                  setWorkLogFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-3 py-1 text-sm border rounded-lg bg-white"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="confirmed">已确认</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工作日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工时</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="admin-worklogs-tbody">
                {workLogs.map((log) => (
                  <tr key={log._id} data-testid={`admin-worklog-row-${log._id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {log.freelancer_id?.freelancer_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {log.company_id?.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(log.work_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.hours_worked}h</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{log.work_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {log.billing_info?.currency} {log.billing_info?.amount?.toLocaleString() || "-"}
                      </div>
                    </td>
                  </tr>
                ))}
                {workLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      暂无工时记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">发票管理</h2>
            <div className="flex gap-2">
              <select
                value={invoiceFilter}
                onChange={(e) => {
                  setInvoiceFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-3 py-1 text-sm border rounded-lg bg-white"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="approved">已批准</option>
                <option value="paid">已支付</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发票号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发票类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开票日期</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="admin-invoices-tbody">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} data-testid={`admin-invoice-row-${invoice._id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {invoice.freelancer_id?.freelancer_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {invoice.company_id?.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{invoice.invoice_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{invoice.total_amount?.toLocaleString() || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {invoice.issued_date
                          ? new Date(invoice.issued_date).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      暂无发票数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {activeTab === "projects" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">项目管理</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工作形式</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">计费类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">招聘人数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">语言要求</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="admin-projects-tbody">
                {projects.map((project) => (
                  <tr key={project._id} data-testid={`admin-project-row-${project._id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.project_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {project.company_id?.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{project.work_format}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {project.rate_type}
                        {project.rate_amount && ` - ¥${project.rate_amount}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{project.hiring_count}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {project.language_requirements?.join(", ") || "-"}
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      暂无项目数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      )}

      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="总收入金额"
              value={`¥${(financialSummary?.totalAmount || 0).toLocaleString()}`}
              icon={<ReceiptPercentIcon className="w-6 h-6 text-white" />}
              color="green"
            />
            <StatCard
              title="税额总额"
              value={`¥${(financialSummary?.totalTaxAmount || 0).toLocaleString()}`}
              icon={<DocumentChartBarIcon className="w-6 h-6 text-white" />}
              color="blue"
            />
            <StatCard
              title="发票数量"
              value={financialSummary?.invoiceCount ?? stats?.totalInvoices ?? 0}
              icon={<ReceiptPercentIcon className="w-6 h-6 text-white" />}
              color="purple"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">发票状态分布</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { status: "draft", label: "草稿", count: financialSummary?.statusBreakdown?.draft || 0 },
                { status: "submitted", label: "已提交", count: financialSummary?.statusBreakdown?.submitted || 0 },
                { status: "approved", label: "已批准", count: financialSummary?.statusBreakdown?.approved || 0 },
                { status: "paid", label: "已支付", count: financialSummary?.statusBreakdown?.paid || 0 },
                { status: "cancelled", label: "已取消", count: financialSummary?.statusBreakdown?.cancelled || 0 },
              ].map(({ status, label, count }) => (
                <div key={status} className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </PortalLayout>
  );
};

export default AdminDashboardPage;
