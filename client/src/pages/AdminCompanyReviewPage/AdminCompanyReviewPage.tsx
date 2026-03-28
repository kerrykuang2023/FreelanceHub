import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import adminService, { ICompany } from "@/services/admin.service";
import PageHeader from "@/components/core-ui/PageHeader";

const AdminCompanyReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<ICompany | null>(null);
  const [relatedUsers, setRelatedUsers] = useState<any[]>([]);
  const [relatedFreelancers, setRelatedFreelancers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCompanyById(id!);
      setCompany(response.data.data.company);
      setRelatedUsers(response.data.data.relatedUsers || []);
      setRelatedFreelancers(response.data.data.relatedFreelancers || []);
    } catch (error) {
      console.error("Failed to load company:", error);
      alert("加载企业数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status: "approved" | "rejected") => {
    const reason = prompt(status === "approved" ? "请输入通过原因（可选）:" : "请输入拒绝原因（必填）:");
    if (status === "rejected" && !reason) {
      alert("拒绝原因不能为空");
      return;
    }

    try {
      setActionLoading(true);
      await adminService.verifyCompany(id!, status, reason);
      alert(`企业已${status === "approved" ? "通过" : "拒绝"}审核`);
      navigate("/admin?tab=companies");
    } catch (error) {
      console.error("Failed to verify company:", error);
      alert("操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "待审核" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "已通过" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "已拒绝" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">企业不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="企业详情"
        description="审核企业注册信息"
        breadcrumbs={[
          { label: "系统管理", href: "/admin" },
          { label: "企业管理", href: "/admin?tab=companies" },
          { label: "企业详情" },
        ]}
        actions={
          company.verification_status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify("rejected")}
                disabled={actionLoading}
                data-testid="reject-btn"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                拒绝
              </button>
              <button
                onClick={() => handleVerify("approved")}
                disabled={actionLoading}
                data-testid="approve-btn"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                通过
              </button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">企业基本信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">企业名称</label>
                <p className="mt-1 text-sm text-gray-900">{company.company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">审核状态</label>
                <p className="mt-1">{getStatusBadge(company.verification_status)}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500">企业描述</label>
                <p className="mt-1 text-sm text-gray-900">
                  {company.profile_description || "暂无描述"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">成立日期</label>
                <p className="mt-1 text-sm text-gray-900">
                  {company.establishment_date
                    ? new Date(company.establishment_date).toLocaleDateString()
                    : "未知"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">企业网站</label>
                <p className="mt-1 text-sm text-gray-900">
                  {company.company_website_url || "未提供"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">审核信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">注册时间</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(company.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">审核时间</label>
                <p className="mt-1 text-sm text-gray-900">
                  {company.verified_at
                    ? new Date(company.verified_at).toLocaleString()
                    : "待审核"}
                </p>
              </div>
              {company.verification_reason && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500">审核原因</label>
                  <p className="mt-1 text-sm text-gray-900">{company.verification_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">关联用户</h2>
            </div>
            {relatedUsers.length > 0 ? (
              <div className="space-y-3">
                {relatedUsers.map((user) => (
                  <div key={user._id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.contact_number || "无电话"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无关联用户</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <BriefcaseIcon className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">关联顾问</h2>
            </div>
            {relatedFreelancers.length > 0 ? (
              <div className="space-y-3">
                {relatedFreelancers.map((freelancer) => (
                  <div key={freelancer._id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {freelancer.freelancer_name || "未知顾问"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {freelancer.freelancer_type || "独立顾问"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无关联顾问</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCompanyReviewPage;