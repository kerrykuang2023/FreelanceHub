import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface MatchScore {
  skill_score: number;
  location_score: number;
  rate_score: number;
  availability_score: number;
  total_score: number;
}

interface Project {
  _id: string;
  project_title: string;
  project_description: string;
  company_id: {
    _id: string;
    company_name: string;
    logo?: string;
  };
  project_major_categories: string[];
  project_sub_categories: string[];
  work_format: string;
  rate_type: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  start_date: string;
  end_date?: string;
  status: string;
  match_score?: MatchScore;
}

const MatchRecommendationsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minScore: 60,
    workFormat: '',
    rateType: '',
    sortBy: 'total_score',
  });
  const [scoreWeights, setScoreWeights] = useState({
    skill: 40,
    location: 20,
    rate: 20,
    availability: 20,
  });

  useEffect(() => {
    loadRecommendations();
  }, [filters, scoreWeights]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/match/recommendations/projects', {
        params: {
          minScore: filters.minScore,
          workFormat: filters.workFormat || undefined,
          rateType: filters.rateType || undefined,
          sortBy: filters.sortBy,
        },
      });
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '高度匹配';
    if (score >= 60) return '良好匹配';
    if (score >= 40) return '一般匹配';
    return '低匹配度';
  };

  const formatBudget = (min?: number, max?: number, currency: string = 'CNY') => {
    const curr = currency === 'CNY' ? '¥' : currency;
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
    if (min) return `${curr}${min.toLocaleString()}起`;
    if (max) return `${curr}${max.toLocaleString()}以内`;
    return '面议';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="w-7 h-7 mr-2 text-yellow-500" />
            智能匹配推荐
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            基于您的技能、地域、费率和可用性，为您推荐最合适的项目
          </p>
        </div>
        <button
          onClick={loadRecommendations}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          刷新推荐
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            筛选条件
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最低匹配度
            </label>
            <select
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={40}>40% 以上</option>
              <option value={60}>60% 以上</option>
              <option value={80}>80% 以上</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工作方式
            </label>
            <select
              value={filters.workFormat}
              onChange={(e) => setFilters({ ...filters, workFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="远程">远程</option>
              <option value="现场">现场</option>
              <option value="混合">混合</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              费率类型
            </label>
            <select
              value={filters.rateType}
              onChange={(e) => setFilters({ ...filters, rateType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="日薪">日薪</option>
              <option value="月薪">月薪</option>
              <option value="项目总价">项目总价</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序方式
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="total_score">综合匹配度</option>
              <option value="skill_score">技能匹配度</option>
              <option value="rate_score">费率匹配度</option>
              <option value="created_at">最新发布</option>
            </select>
          </div>
        </div>

        {/* Score Weights */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">匹配权重设置</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'skill', label: '技能匹配', color: 'bg-blue-500' },
              { key: 'location', label: '地域匹配', color: 'bg-green-500' },
              { key: 'rate', label: '费率匹配', color: 'bg-purple-500' },
              { key: 'availability', label: '可用性匹配', color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium">{scoreWeights[item.key as keyof typeof scoreWeights]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreWeights[item.key as keyof typeof scoreWeights]}
                  onChange={(e) => setScoreWeights({
                    ...scoreWeights,
                    [item.key]: parseInt(e.target.value),
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {project.company_id?.logo ? (
                        <img
                          src={project.company_id.logo}
                          alt={project.company_id.company_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.project_title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(project.match_score?.total_score || 0)}`}>
                          {project.match_score?.total_score || 0}% 匹配
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.company_id?.company_name}
                      </p>
                      <p className="text-gray-600 mt-2 line-clamp-2">
                        {project.project_description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.project_sub_categories?.slice(0, 3).map((cat, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {project.work_format}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                          {formatBudget(project.budget_min, project.budget_max, project.currency)}
                          <span className="ml-1 text-gray-400">/{project.rate_type}</span>
                        </span>
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {project.work_format}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(project.start_date)}
                          {project.end_date && ` - ${formatDate(project.end_date)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score Breakdown */}
                  <div className="ml-6 flex-shrink-0">
                    <div className="w-32 space-y-2">
                      {[
                        { label: '技能', score: project.match_score?.skill_score || 0, color: 'bg-blue-500' },
                        { label: '地域', score: project.match_score?.location_score || 0, color: 'bg-green-500' },
                        { label: '费率', score: project.match_score?.rate_score || 0, color: 'bg-purple-500' },
                        { label: '可用性', score: project.match_score?.availability_score || 0, color: 'bg-orange-500' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{item.label}</span>
                            <span className="font-medium">{item.score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`${item.color} h-1.5 rounded-full transition-all duration-300`}
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className={`text-sm font-medium ${getScoreColor(project.match_score?.total_score || 0).split(' ')[0]}`}>
                    {getScoreLabel(project.match_score?.total_score || 0)}
                  </span>
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/jobs/${project._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      查看详情
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      立即申请
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无匹配项目</h3>
          <p className="text-gray-500 mb-4">
            完善您的个人档案和技能标签，获取更精准的项目推荐
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            完善档案
          </Link>
        </div>
      )}
    </div>
  );
};

export default MatchRecommendationsPage;
