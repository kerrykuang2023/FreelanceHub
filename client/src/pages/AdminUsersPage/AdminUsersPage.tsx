import { useState, useEffect } from "react";
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import HttpService from "@/core/http.service";
import PageHeader from "@/components/core-ui/PageHeader";

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

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "freelancer" | "company" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
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
      setUsers(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.user_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getUserTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      freelancer: { bg: "bg-blue-100", text: "text-blue-800", label: "自由顾问" },
      company: { bg: "bg-purple-100", text: "text-purple-800", label: "企业用户" },
      admin: { bg: "bg-red-100", text: "text-red-800", label: "管理员" },
    };
    const c = config[type] || { bg: "bg-gray-100", text: "text-gray-800", label: type };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: "bg-green-100", text: "text-green-800", label: "正常" },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "未激活" },
      suspended: { bg: "bg-red-100", text: "text-red-800", label: "已禁用" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户管理"
        description="管理系统用户账户"
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
                placeholder="搜索用户名、邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部类型</option>
              <option value="freelancer">自由顾问</option>
              <option value="company">企业用户</option>
              <option value="admin">管理员</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部状态</option>
              <option value="active">正常</option>
              <option value="inactive">未激活</option>
              <option value="suspended">已禁用</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">认证</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后登录</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
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
                        <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString("zh-CN") : "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {user.status === "active" && (
                      <button
                        onClick={() => handleUpdateUserStatus(user._id, "suspended")}
                        className="text-red-600 hover:text-red-900"
                        title="禁用"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    {user.status === "suspended" && (
                      <button
                        onClick={() => handleUpdateUserStatus(user._id, "active")}
                        className="text-green-600 hover:text-green-900"
                        title="启用"
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

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            共 {pagination.total} 条记录
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
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
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
