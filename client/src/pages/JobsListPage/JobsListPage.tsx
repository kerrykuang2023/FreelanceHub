import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BookmarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import jobsService from "@/services/jobs.service";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import { IJob } from "@/interfaces";
import PageHeader from "@/components/core-ui/PageHeader";

interface SearchFilters {
  keyword: string;
  job_type: string;
  work_mode: string;
  salary_range: string;
  experience_level: string;
  location: string;
}

const JobsListPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [filters, setSearchFilters] = useState<SearchFilters>({
    keyword: "",
    job_type: "",
    work_mode: "",
    salary_range: "",
    experience_level: "",
    location: "",
  });

  useEffect(() => {
    fetchJobs();
    loadSavedJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsService.getJobs();
      const jobsList = (response as any).jobs || response || [];
      setJobs(jobsList);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = () => {
    const saved = localStorage.getItem("saved_jobs");
    if (saved) {
      const savedJobs = JSON.parse(saved);
      setSavedJobIds(new Set(savedJobs.map((job: IJob) => job._id)));
    }
  };

  const handleSaveJob = (job: IJob, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = localStorage.getItem("saved_jobs");
    let savedJobs: IJob[] = saved ? JSON.parse(saved) : [];

    if (savedJobIds.has(job._id)) {
      savedJobs = savedJobs.filter((j) => j._id !== job._id);
      setSavedJobIds(new Set(savedJobs.map((j) => j._id)));
    } else {
      savedJobs.push(job);
      setSavedJobIds(new Set([...savedJobIds, job._id]));
    }

    localStorage.setItem("saved_jobs", JSON.stringify(savedJobs));
  };

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      keyword: "",
      job_type: "",
      work_mode: "",
      salary_range: "",
      experience_level: "",
      location: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <PortalLayout title="浏览项目">
      <div className="flex-1 w-full" data-testid="jobs-list-page">
        <PageHeader
          title="发现机会"
          description={`${jobs.length} 个职位可供选择`}
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "浏览项目" },
          ]}
          actions={
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              data-testid="toggle-filters-btn"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              筛选
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {Object.values(filters).filter((v) => v !== "").length}
                </span>
              )}
            </button>
          }
        />

        <div className="bg-white border-b rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索职位、公司或关键词..."
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange("keyword", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="keyword-search"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  data-testid="clear-filters-btn"
                >
                  <XMarkIcon className="w-5 h-5 mr-1" />
                  清除
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    职位类型
                  </label>
                  <select
                    value={filters.job_type}
                    onChange={(e) => handleFilterChange("job_type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="job-type-filter"
                  >
                    <option value="">全部</option>
                    <option value="全职">全职</option>
                    <option value="兼职">兼职</option>
                    <option value="自由顾问">自由顾问</option>
                    <option value="实习">实习</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作形式
                  </label>
                  <select
                    value={filters.work_mode}
                    onChange={(e) => handleFilterChange("work_mode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="work-mode-filter"
                  >
                    <option value="">全部</option>
                    <option value="远程">远程</option>
                    <option value="现场">现场</option>
                    <option value="混合">混合</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    经验要求
                  </label>
                  <select
                    value={filters.experience_level}
                    onChange={(e) => handleFilterChange("experience_level", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="experience-filter"
                  >
                    <option value="">全部</option>
                    <option value="初级">初级</option>
                    <option value="中级">中级</option>
                    <option value="高级">高级</option>
                    <option value="专家">专家</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    薪资范围
                  </label>
                  <select
                    value={filters.salary_range}
                    onChange={(e) => handleFilterChange("salary_range", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="salary-filter"
                  >
                    <option value="">全部</option>
                    <option value="0-5000">¥0-5,000</option>
                    <option value="5000-10000">¥5,000-10,000</option>
                    <option value="10000-20000">¥10,000-20,000</option>
                    <option value="20000-50000">¥20,000-50,000</option>
                    <option value="50000+">¥50,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作地点
                  </label>
                  <input
                    type="text"
                    placeholder="城市或地区"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="location-filter"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无职位</h3>
              <p className="text-gray-600">暂无符合筛选条件的职位</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  data-testid={`job-${job._id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.job_title || job.job_description?.substring(0, 80) || "职位"}
                            {!job.job_title && job.job_description && job.job_description.length > 80 && "..."}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            <span>{job.company_id?.company_name || "公司"}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleSaveJob(job, e)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                          data-testid={`save-job-${job._id}`}
                        >
                          {savedJobIds.has(job._id) ? (
                            <BookmarkSolidIcon className="w-6 h-6 text-blue-600" />
                          ) : (
                            <BookmarkIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>
                            {job.job_location_id?.city || "地点"}
                            {job.job_location_id?.country && `, ${job.job_location_id.country}`}
                          </span>
                        </div>

                        {job.job_type_id?.job_type && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {job.job_type_id.job_type}
                          </span>
                        )}

                        {job.salary_range && (
                          <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            <span className="text-green-600 font-medium">
                              {job.salary_range}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {job.posted_date
                              ? new Date(job.posted_date).toLocaleDateString("zh-CN")
                              : "近期"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {job.skills_required.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {typeof skill === "string" ? skill : (skill as any).skill_name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default JobsListPage;
