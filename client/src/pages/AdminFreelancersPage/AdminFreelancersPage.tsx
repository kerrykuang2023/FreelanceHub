import { useState, useEffect } from "react";
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import httpService from "@/core/http.service";
import PageHeader from "@/components/core-ui/PageHeader";

interface Freelancer {
  _id: string;
  user_id: {
    _id: string;
    user_name: string;
    email: string;
    user_image?: string;
  };
  headline?: string;
  skills?: Array<{
    skill_name: string;
    skill_level: string;
    years_of_experience: number;
  }>;
  hourly_rate?: number;
  availability_status?: string;
  rating?: {
    average: number;
    count: number;
  };
  is_verified: boolean;
  profile_completion?: number;
  created_at: string;
}

const AdminFreelancersPage = () => {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "busy" | "unavailable">("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    loadFreelancers();
  }, [pagination.page, filter, availabilityFilter]);

  const loadFreelancers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (filter === "verified") params.append("is_verified", "true");
      if (filter === "unverified") params.append("is_verified", "false");
      if (availabilityFilter !== "all") params.append("availability_status", availabilityFilter);

      const response = await httpService.get(`/admin/freelancers?${params.toString()}`);
      setFreelancers(response.data?.data || []);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFreelancer = async (freelancerId: string, verified: boolean) => {
    try {
      await httpService.put(`/admin/freelancers/${freelancerId}/verify`, { is_verified: verified });
      loadFreelancers();
    } catch (error) {
      console.error("Failed to verify freelancer:", error);
    }
  };

  const filteredFreelancers = freelancers.filter((freelancer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        freelancer.user_id?.user_name?.toLowerCase().includes(query) ||
        freelancer.user_id?.email?.toLowerCase().includes(query) ||
        freelancer.headline?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(rating) ? (
        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="w-4 h-4 text-gray-300" />
      )
    ));
  };

  const getAvailabilityBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      available: { bg: "bg-green-100", text: "text-green-800", label: "可接单" },
      busy: { bg: "bg-yellow-100", text: "text-yellow-800", label: "较忙" },
      unavailable: { bg: "bg-gray-100", text: "text-gray-800", label: "不可用" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading && freelancers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="顾问管理"
        description="管理自由顾问档案和认证"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "系统管理" },
          { label: "顾问管理" },
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索顾问姓名、邮箱、简介..."
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
              <option value="all">全部认证状态</option>
              <option value="verified">已认证</option>
              <option value="unverified">未认证</option>
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部可用状态</option>
              <option value="available">可接单</option>
              <option value="busy">较忙</option>
              <option value="unavailable">不可用</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">技能</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">费率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">可用状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">评分</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">认证</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">完整度</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFreelancers.map((freelancer) => (
                <tr key={freelancer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        {freelancer.user_id?.user_image ? (
                          <img src={freelancer.user_id.user_image} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <UserCircleIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {freelancer.user_id?.user_name || "未知"}
                        </div>
                        <div className="text-sm text-gray-500">{freelancer.user_id?.email}</div>
                        {freelancer.headline && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {freelancer.headline}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {freelancer.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          {skill.skill_name}
                        </span>
                      ))}
                      {freelancer.skills && freelancer.skills.length > 3 && (
                        <span className="text-xs text-gray-400">+{freelancer.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {freelancer.hourly_rate ? `¥${freelancer.hourly_rate}/h` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {getAvailabilityBadge(freelancer.availability_status || "unavailable")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {renderStars(freelancer.rating?.average || 0)}
                      <span className="ml-1 text-sm text-gray-500">
                        ({freelancer.rating?.count || 0})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {freelancer.is_verified ? (
                      <span className="inline-flex items-center text-green-600">
                        <ShieldCheckIcon className="w-5 h-5 mr-1" />
                        已认证
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-400">
                        <ShieldCheckIcon className="w-5 h-5 mr-1" />
                        未认证
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${freelancer.profile_completion || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{freelancer.profile_completion || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" title="查看详情">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {!freelancer.is_verified && (
                      <button
                        onClick={() => handleVerifyFreelancer(freelancer._id, true)}
                        className="text-green-600 hover:text-green-900"
                        title="认证通过"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    {freelancer.is_verified && (
                      <button
                        onClick={() => handleVerifyFreelancer(freelancer._id, false)}
                        className="text-red-600 hover:text-red-900"
                        title="取消认证"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFreelancers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    暂无顾问数据
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

export default AdminFreelancersPage;
