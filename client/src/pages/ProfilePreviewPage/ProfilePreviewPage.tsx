import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UserCircleIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import freelancerProfileService from '@/services/freelancer-profile.service';

interface Skill {
  _id: string;
  skill_name: string;
  skill_level: '初级' | '中级' | '高级' | '专家';
  years_of_experience: number;
}

interface ProjectExperience {
  _id: string;
  project_name: string;
  company_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  description: string;
  technologies: string[];
}

interface Certification {
  _id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface FreelancerProfile {
  _id: string;
  user_id: {
    _id: string;
    user_name: string;
    email: string;
    user_image?: string;
  };
  headline?: string;
  summary?: string;
  skills?: Skill[];
  project_experiences?: ProjectExperience[];
  certifications?: Certification[];
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  preferred_currency?: string;
  availability_status?: string;
  available_hours_per_week?: number;
  rating?: {
    average: number;
    count: number;
  };
  completed_projects?: number;
  profile_completion?: number;
}

const ProfilePreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await freelancerProfileService.getProfileById(id!);
      if (response.profile) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserCircleIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">档案不存在</h1>
          <p className="text-gray-600 mb-6">该自由顾问档案不存在或无法访问</p>
          <Link
            to="/freelancers"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            浏览所有顾问
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="profile-preview-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile.user_id.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.user_id.user_name}</h1>
                <p className="text-lg text-gray-600 mt-1">{profile.headline || '自由顾问'}</p>
                <div className="flex items-center mt-2 space-x-4">
                  {profile.rating && (
                    <div className="flex items-center">
                      <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-900">
                        {profile.rating.average.toFixed(1)}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        ({profile.rating.count}条评价)
                      </span>
                    </div>
                  )}
                  {profile.completed_projects && (
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span className="ml-1 text-sm text-gray-600">
                        {profile.completed_projects} 个项目
                      </span>
                    </div>
                  )}
                  {profile.availability_status && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.availability_status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {profile.availability_status === 'available' ? '可接单' : '忙碌中'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`/chat/${profile.user_id._id}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              data-testid="contact-btn"
            >
              联系我
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.summary && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600" />
                  关于我
                </h2>
                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="w-6 h-6 mr-2 text-purple-600" />
                  技能专长
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill._id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      data-testid={`skill-${skill.skill_name}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{skill.skill_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {skill.years_of_experience}年经验
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            skill.skill_level === '专家'
                              ? 'bg-purple-100 text-purple-700'
                              : skill.skill_level === '高级'
                              ? 'bg-blue-100 text-blue-700'
                              : skill.skill_level === '中级'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {skill.skill_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Experience */}
            {profile.project_experiences && profile.project_experiences.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="w-6 h-6 mr-2 text-green-600" />
                  项目经验
                </h2>
                <div className="space-y-4">
                  {profile.project_experiences.map((project) => (
                    <div
                      key={project._id}
                      className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                      data-testid={`project-${project.project_name}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
                          <p className="text-sm text-gray-600">{project.company_name}</p>
                          <p className="text-sm text-gray-500">{project.role}</p>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {project.start_date} - {project.end_date || '至今'}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AcademicCapIcon className="w-6 h-6 mr-2 text-yellow-600" />
                  认证证书
                </h2>
                <div className="space-y-4">
                  {profile.certifications.map((cert) => (
                    <div
                      key={cert._id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                      data-testid={`certification-${cert.certification_name}`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{cert.certification_name}</h3>
                        <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          颁发日期：{cert.issue_date}
                          {cert.expiry_date && ` | 有效期至：${cert.expiry_date}`}
                        </div>
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            <GlobeAltIcon className="w-4 h-4 inline mr-1" />
                            验证证书
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate Card */}
            {(profile.hourly_rate || profile.daily_rate || profile.monthly_rate) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 mr-2 text-green-600" />
                  服务费率
                </h2>
                <div className="space-y-3">
                  {profile.hourly_rate && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">小时费率</span>
                      <span className="font-semibold text-gray-900">
                        ¥{profile.hourly_rate}/小时
                      </span>
                    </div>
                  )}
                  {profile.daily_rate && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">日费率</span>
                      <span className="font-semibold text-gray-900">
                        ¥{profile.daily_rate}/天
                      </span>
                    </div>
                  )}
                  {profile.monthly_rate && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">月费率</span>
                      <span className="font-semibold text-gray-900">
                        ¥{profile.monthly_rate}/月
                      </span>
                    </div>
                  )}
                  {profile.preferred_currency && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      货币单位：{profile.preferred_currency}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Availability */}
            {profile.available_hours_per_week && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                  可用时间
                </h2>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {profile.available_hours_per_week}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">小时/周</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">档案统计</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">档案完整度</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${profile.profile_completion || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {profile.profile_completion || 0}%
                    </span>
                  </div>
                </div>
                {profile.completed_projects && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">完成项目</span>
                    <span className="text-sm font-medium text-gray-900">
                      {profile.completed_projects}
                    </span>
                  </div>
                )}
                {profile.rating && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">平均评分</span>
                      <div className="flex items-center">
                        <StarSolidIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {profile.rating.average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">评价数量</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile.rating.count}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="space-y-3">
                <Link
                  to={`/projects?freelancer=${id}`}
                  className="block w-full px-4 py-2 text-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  data-testid="view-projects-btn"
                >
                  查看项目
                </Link>
                <Link
                  to={`/freelancers`}
                  className="block w-full px-4 py-2 text-center text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  data-testid="browse-all-btn"
                >
                  浏览所有顾问
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewPage;
