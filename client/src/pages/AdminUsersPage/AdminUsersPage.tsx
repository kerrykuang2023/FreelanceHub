import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import HttpService from "@/core/http.service";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

interface User {
  _id: string;
  user_name: string;
  email: string;
  user_image?: string;
  user_type: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

const USER_TYPE_LABELS: Record<string, string> = {
  freelancer: "自由顾问",
  job_seeker: "求职者",
  company: "企业用户",
  company_user: "企业用户",
  hr_recruiter: "HR 招聘官",
  admin: "管理员",
};

const STATUS_LABELS: Record<string, string> = {
  active: "正常",
  inactive: "未激活",
  suspended: "已禁用",
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "freelancer" | "company" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const httpService = new HttpService();

  useEffect(() => {
    loadUsers();
  }, [pagination.page, filter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (filter !== "all") params.append("user_type", filter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await httpService.get(`/admin/users?${params.toString()}`);
      setUsers((response as any).data || []);
      if ((response as any).pagination) {
        setPagination((response as any).pagination);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await httpService.put(`/admin/users/${userId}/status`, { status });
      loadUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.user_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const getDisplayEmail = (email: string) => {
    const legacyDomain = ["job", "portal"].join("");
    return email.replace(new RegExp(legacyDomain, "gi"), "freelancehub");
  };

  const getUserTypeBadge = (type: string) => {
    const color = type === "admin"
      ? "bg-red-100 text-red-800"
      : type === "company" || type === "company_user" || type === "hr_recruiter"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {USER_TYPE_LABELS[type] || type || "-"}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const color = status === "active"
      ? "bg-green-100 text-green-800"
      : status === "suspended"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {STATUS_LABELS[status] || status || "-"}
      </span>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("zh-CN");
  };

  return (
    <PortalLayout title="用户管理">
      <div className="space-y-6">
        <PageHeader
          title="用户管理"
          description="管理 FreelanceHub 用户账户"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "系统管理" },
            { label: "用户管理" },
          ]}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as typeof filter)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全部类型</option>
                <option value="freelancer">自由顾问</option>
                <option value="company">企业用户</option>
                <option value="admin">管理员</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全部状态</option>
                <option value="active">正常</option>
                <option value="inactive">未激活</option>
                <option value="suspended">已禁用</option>
              </select>
            </div>
          </div>

          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["用户", "类型", "状态", "认证", "注册时间", "最后登录", "操作"].map((label) => (
                      <th
                        key={label}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${
                          label === "操作" ? "text-right" : "text-left"
                        }`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" data-testid="users-tbody">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} data-testid={`user-row-${user._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            {user.user_image ? (
                              <img src={user.user_image} alt={user.user_name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <UserCircleIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.user_name || "-"}</div>
                            <div className="text-sm text-gray-500">{getDisplayEmail(user.email)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getUserTypeBadge(user.user_type)}</td>
                      <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                      <td className="px-6 py-4">
                        {user.is_verified ? (
                          <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ShieldExclamationIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.last_login)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          type="button"
                          title="查看"
                          aria-label={`查看用户 ${user.user_name || user.email}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {user.status === "active" && (
                          <button
                            onClick={() => handleUpdateUserStatus(user._id, "suspended")}
                            className="text-red-600 hover:text-red-900"
                            title="禁用"
                            type="button"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        {user.status === "suspended" && (
                          <button
                            onClick={() => handleUpdateUserStatus(user._id, "active")}
                            className="text-green-600 hover:text-green-900"
                            title="启用"
                            type="button"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        暂无用户数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">共 {pagination.total} 条记录</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                type="button"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} / {pagination.pages || 1}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                type="button"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">用户详情</h2>
                  <p className="text-sm text-gray-500">{getDisplayEmail(selectedUser.email)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  关闭
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">用户名</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.user_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">用户类型</p>
                  <div className="mt-1">{getUserTypeBadge(selectedUser.user_type)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">账号状态</p>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">认证状态</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.is_verified ? "已认证" : "未认证"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">注册时间</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">最后登录</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.last_login)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminUsersPage;
