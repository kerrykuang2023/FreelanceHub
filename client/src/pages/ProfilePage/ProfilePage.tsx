import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  EyeIcon,
  GlobeAltIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import freelancerProfileService from '@/services/freelancer-profile.service';
import SkillModal from './components/SkillModal';
import ProjectExperienceModal from './components/ProjectExperienceModal';
import CertificationModal from './components/CertificationModal';
import BasicInfoModal from './components/BasicInfoModal';
import PageHeader from '@/components/core-ui/PageHeader';
import PortalLayout from '@/components/layouts/portal/PortalLayout';
import StatCard from '@/components/core-ui/StatCard';

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
    phone?: string;
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
  location?: string;
  languages?: { language: string; proficiency: string }[];
  portfolio_links?: { title: string; url: string }[];
  education?: {
    _id: string;
    school: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
  }[];
}

type TabType = 'overview' | 'skills' | 'experience' | 'education' | 'certifications' | 'settings';

const ProfilePage = () => {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingExperience, setEditingExperience] = useState<ProjectExperience | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);

  const [rateForm, setRateForm] = useState({
    hourly_rate: '',
    daily_rate: '',
    monthly_rate: '',
    preferred_currency: 'CNY',
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    availability_status: 'available',
    available_hours_per_week: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await freelancerProfileService.getMyProfile();
      if (response.profile) {
        setProfile(response.profile);
        setRateForm({
          hourly_rate: response.profile.hourly_rate?.toString() || '',
          daily_rate: response.profile.daily_rate?.toString() || '',
          monthly_rate: response.profile.monthly_rate?.toString() || '',
          preferred_currency: response.profile.preferred_currency || 'CNY',
        });
        setAvailabilityForm({
          availability_status: response.profile.availability_status || 'available',
          available_hours_per_week: response.profile.available_hours_per_week?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (data: any) => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.addSkill(data);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to add skill:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSkill = async (data: any) => {
    if (!editingSkill?._id) return;
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateSkill(editingSkill._id, data);
      if (response.success) {
        setEditingSkill(null);
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to update skill:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('确定要删除这个技能吗？')) return;
    try {
      const response = await freelancerProfileService.deleteSkill(skillId);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  const handleAddExperience = async (data: any) => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.addProjectExperience(data);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to add experience:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExperience = async (data: any) => {
    if (!editingExperience?._id) return;
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateProjectExperience(editingExperience._id, data);
      if (response.success) {
        setEditingExperience(null);
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to update experience:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('确定要删除这个项目经历吗？')) return;
    try {
      const response = await freelancerProfileService.deleteProjectExperience(experienceId);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to delete experience:', error);
    }
  };

  const handleAddCertification = async (data: any) => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.addCertification(data);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to add certification:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCertification = async (data: any) => {
    if (!editingCertification?._id) return;
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateCertification(editingCertification._id, data);
      if (response.success) {
        setEditingCertification(null);
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to update certification:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertification = async (certId: string) => {
    if (!confirm('确定要删除这个证书吗？')) return;
    try {
      const response = await freelancerProfileService.deleteCertification(certId);
      if (response.success) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to delete certification:', error);
    }
  };

  const handleSaveRates = async () => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateRates({
        hourly_rate: rateForm.hourly_rate ? parseFloat(rateForm.hourly_rate) : undefined,
        daily_rate: rateForm.daily_rate ? parseFloat(rateForm.daily_rate) : undefined,
        monthly_rate: rateForm.monthly_rate ? parseFloat(rateForm.monthly_rate) : undefined,
        preferred_currency: rateForm.preferred_currency,
      });
      if (response.success) {
        await loadProfile();
        alert('费率设置已保存');
      }
    } catch (error) {
      console.error('Failed to save rates:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateAvailability({
        availability_status: availabilityForm.availability_status,
        available_hours_per_week: availabilityForm.available_hours_per_week 
          ? parseInt(availabilityForm.available_hours_per_week) 
          : undefined,
      });
      if (response.success) {
        await loadProfile();
        alert('可用性设置已保存');
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBasicInfo = async (data: { headline: string; summary: string; location: string }) => {
    try {
      setSaving(true);
      const response = await freelancerProfileService.updateBasicInfo(data);
      if (response.success) {
        setShowBasicInfoModal(false);
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to update basic info:', error);
    } finally {
      setSaving(false);
    }
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;
    
    let completion = 0;
    const weights = {
      summary: 15,
      skills: 15,
      project_experiences: 15,
      certifications: 10,
      hourly_rate: 10,
      availability_status: 10,
      headline: 5,
      location: 5,
      languages: 5,
      education: 10,
    };

    if (profile.summary && profile.summary.length > 10) completion += weights.summary;
    if (profile.skills && profile.skills.length > 0) completion += weights.skills;
    if (profile.project_experiences && profile.project_experiences.length > 0) completion += weights.project_experiences;
    if (profile.certifications && profile.certifications.length > 0) completion += weights.certifications;
    if (profile.hourly_rate || profile.daily_rate || profile.monthly_rate) completion += weights.hourly_rate;
    if (profile.availability_status) completion += weights.availability_status;
    if (profile.headline) completion += weights.headline;
    if (profile.location) completion += weights.location;
    if (profile.languages && profile.languages.length > 0) completion += weights.languages;
    if (profile.education && profile.education.length > 0) completion += weights.education;

    return Math.min(100, completion);
  };

  const completion = getProfileCompletion();

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '初级': 'bg-green-100 text-green-700 border border-green-200',
      '中级': 'bg-blue-100 text-blue-700 border border-blue-200',
      '高级': 'bg-purple-100 text-purple-700 border border-purple-200',
      '专家': 'bg-orange-100 text-orange-700 border border-orange-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getAvailabilityBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'available': { bg: 'bg-green-500', text: 'text-white', label: '可接单' },
      'busy': { bg: 'bg-yellow-500', text: 'text-white', label: '较忙' },
      'unavailable': { bg: 'bg-gray-400', text: 'text-white', label: '不可用' },
    };
    return badges[status] || badges['unavailable'];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(rating) ? (
        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="w-4 h-4 text-gray-300" />
      )
    ));
  };

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: '概览', icon: UserCircleIcon },
    { id: 'skills', label: '专业技能', icon: AcademicCapIcon },
    { id: 'experience', label: '项目经历', icon: BriefcaseIcon },
    { id: 'education', label: '教育背景', icon: AcademicCapIcon },
    { id: 'certifications', label: '资质证书', icon: DocumentTextIcon },
    { id: 'settings', label: '设置', icon: CurrencyDollarIcon },
  ];

  if (loading) {
    return (
      <PortalLayout title="个人档案">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!profile) {
    return (
      <PortalLayout title="个人档案">
        <div className="text-center py-12">
          <UserCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">档案未找到</h2>
          <p className="text-gray-500 mb-4">请先完善您的个人档案</p>
          <button
            onClick={loadProfile}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            创建档案
          </button>
        </div>
      </PortalLayout>
    );
  }

  const availabilityBadge = getAvailabilityBadge(profile.availability_status || 'unavailable');

  return (
    <PortalLayout title="个人档案">
      <div className="space-y-6" data-testid="profile-container">
        <PageHeader
          title="个人档案"
          description="管理您的个人资料、技能和项目经历"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "个人档案" },
          ]}
          actions={
            <Link
              to={`/profile/preview/${profile._id}`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              data-testid="preview-profile-btn"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              预览档案
            </Link>
          }
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative flex-shrink-0">
                  {profile.user_id?.user_image ? (
                    <img
                      src={profile.user_id.user_image}
                      alt={profile.user_id.user_name}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <UserCircleIcon className="w-14 h-14 text-white" />
                    </div>
                  )}
                  <button 
                    className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md hover:bg-gray-50 transition-colors border border-gray-100" 
                    data-testid="edit-avatar-btn"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg text-xs font-medium ${availabilityBadge.bg} ${availabilityBadge.text}`}>
                    {availabilityBadge.label}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900" data-testid="user-name">
                    {profile.user_id?.user_name || '未设置姓名'}
                  </h2>
                  {profile.headline && (
                    <p className="text-gray-600 mt-1">{profile.headline}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-sm text-gray-500">
                    {profile.user_id?.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        {profile.user_id.email}
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    {renderStars(profile.rating?.average || 0)}
                    <span className="text-sm text-gray-500 ml-1">
                      ({profile.rating?.count || 0} 条评价)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{profile.completed_projects || 0}</p>
                  <p className="text-xs text-gray-500">完成项目</p>
                </div>
                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{completion}%</p>
                  <p className="text-xs text-gray-500">档案完整度</p>
                </div>
                {(profile.hourly_rate || profile.daily_rate) && (
                  <div className="text-center px-4 py-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <p className="text-2xl font-bold text-green-600">
                      ¥{profile.hourly_rate || profile.daily_rate}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.hourly_rate ? '/小时' : '/天'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">档案完整度</span>
                <span className="text-sm font-medium text-blue-600">{completion}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="核心技能"
            value={profile.skills?.length || 0}
            icon={<AcademicCapIcon className="w-6 h-6 text-white" />}
            color="blue"
          />
          <StatCard
            title="项目经历"
            value={profile.project_experiences?.length || 0}
            icon={<BriefcaseIcon className="w-6 h-6 text-white" />}
            color="purple"
          />
          <StatCard
            title="资质证书"
            value={profile.certifications?.length || 0}
            icon={<DocumentTextIcon className="w-6 h-6 text-white" />}
            color="green"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">个人简介</h3>
                    <button
                      onClick={() => setShowBasicInfoModal(true)}
                      data-testid="edit-profile-btn"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      编辑
                    </button>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {profile.summary || '暂无个人简介，点击编辑添加您的介绍...'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center text-gray-500 mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">期望费率</span>
                    </div>
                    <div className="space-y-1">
                      {profile.hourly_rate && (
                        <p className="text-lg font-semibold text-gray-900">
                          ¥{profile.hourly_rate}/小时
                        </p>
                      )}
                      {profile.daily_rate && (
                        <p className="text-lg font-semibold text-gray-900">
                          ¥{profile.daily_rate}/天
                        </p>
                      )}
                      {!profile.hourly_rate && !profile.daily_rate && (
                        <p className="text-gray-400">未设置</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center text-gray-500 mb-2">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">可用状态</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                      profile.availability_status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : profile.availability_status === 'busy'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {profile.availability_status === 'available' ? '可接单' : 
                       profile.availability_status === 'busy' ? '较忙' : '不可用'}
                    </span>
                    {profile.available_hours_per_week && (
                      <p className="text-sm text-gray-500 mt-2">
                        每周可工作 {profile.available_hours_per_week} 小时
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center text-gray-500 mb-2">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">语言能力</span>
                    </div>
                    <div className="space-y-1">
                      {profile.languages && profile.languages.length > 0 ? (
                        profile.languages.slice(0, 2).map((lang, i) => (
                          <p key={i} className="text-sm text-gray-700">
                            {lang.language} - {lang.proficiency}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-400">未设置</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center text-gray-500 mb-2">
                      <LinkIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">作品集</span>
                    </div>
                    <div className="space-y-1">
                      {profile.portfolio_links && profile.portfolio_links.length > 0 ? (
                        profile.portfolio_links.slice(0, 2).map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 block truncate"
                          >
                            {link.title}
                          </a>
                        ))
                      ) : (
                        <p className="text-gray-400">未设置</p>
                      )}
                    </div>
                  </div>
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">核心技能</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill._id}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getSkillLevelColor(skill.skill_level)}`}
                        >
                          {skill.skill_name}
                          <span className="ml-1 opacity-70">· {skill.years_of_experience}年</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">专业技能</h3>
                  <button 
                    onClick={() => {
                      setEditingSkill(null);
                      setShowSkillModal(true);
                    }}
                    data-testid="add-skill-btn"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    添加技能
                  </button>
                </div>
                <div data-testid="skill-list">
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.skills.map((skill) => (
                        <div
                          key={skill._id}
                          className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getSkillLevelColor(skill.skill_level)}`}>
                                  {skill.skill_level}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {skill.years_of_experience} 年经验
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingSkill(skill);
                                  setShowSkillModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSkill(skill._id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <AcademicCapIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">暂无技能，添加您的专业技能</p>
                      <button 
                        onClick={() => setShowSkillModal(true)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <PlusIcon className="w-5 h-5 mr-1" />
                        添加第一个技能
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">项目经历</h3>
                  <button 
                    onClick={() => {
                      setEditingExperience(null);
                      setShowExperienceModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    添加经历
                  </button>
                </div>

                {profile.project_experiences && profile.project_experiences.length > 0 ? (
                  <div className="space-y-4">
                    {profile.project_experiences.map((exp, index) => (
                      <div
                        key={exp._id}
                        className="group relative pl-8 pb-6 last:pb-0"
                      >
                        {index < (profile.project_experiences?.length || 0) - 1 && (
                          <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 ring-4 ring-white"></div>
                        <div className="bg-gray-50 rounded-xl p-5 group-hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{exp.project_name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{exp.company_name} · {exp.role}</p>
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {new Date(exp.start_date).toLocaleDateString('zh-CN')} - 
                                {exp.end_date ? new Date(exp.end_date).toLocaleDateString('zh-CN') : '至今'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingExperience(exp);
                                  setShowExperienceModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteExperience(exp._id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-3 text-sm leading-relaxed">{exp.description}</p>
                          {exp.technologies && exp.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {exp.technologies.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BriefcaseIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">暂无项目经历</p>
                    <button 
                      onClick={() => setShowExperienceModal(true)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <PlusIcon className="w-5 h-5 mr-1" />
                      添加项目经历
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">教育背景</h3>
                  <button 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    添加教育经历
                  </button>
                </div>

                {profile.education && profile.education.length > 0 ? (
                  <div className="space-y-4">
                    {profile.education.map((edu) => (
                      <div
                        key={edu._id}
                        className="group bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <AcademicCapIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{edu.school}</h4>
                              <p className="text-sm text-gray-600 mt-1">{edu.degree} · {edu.field_of_study}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(edu.start_date).getFullYear()} - 
                                {edu.end_date ? new Date(edu.end_date).getFullYear() : '至今'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AcademicCapIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">暂无教育背景</p>
                    <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                      <PlusIcon className="w-5 h-5 mr-1" />
                      添加教育经历
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">资质证书</h3>
                  <button 
                    onClick={() => {
                      setEditingCertification(null);
                      setShowCertificationModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    添加证书
                  </button>
                </div>

                {profile.certifications && profile.certifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.certifications.map((cert) => (
                      <div
                        key={cert._id}
                        className="group bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{cert.certification_name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{cert.issuing_organization}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                颁发于 {new Date(cert.issue_date).toLocaleDateString('zh-CN')}
                              </p>
                              {cert.credential_id && (
                                <p className="text-xs text-gray-400 mt-0.5">证书编号: {cert.credential_id}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingCertification(cert);
                                setShowCertificationModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCertification(cert._id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">暂无资质证书</p>
                    <button 
                      onClick={() => setShowCertificationModal(true)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <PlusIcon className="w-5 h-5 mr-1" />
                      添加证书
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">费率设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        时薪 (元)
                      </label>
                      <input
                        type="number"
                        data-testid="hourly-rate-input"
                        value={rateForm.hourly_rate}
                        onChange={(e) => setRateForm({ ...rateForm, hourly_rate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="如: 500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        日薪 (元)
                      </label>
                      <input
                        type="number"
                        value={rateForm.daily_rate}
                        onChange={(e) => setRateForm({ ...rateForm, daily_rate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="如: 3000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        月薪 (元)
                      </label>
                      <input
                        type="number"
                        value={rateForm.monthly_rate}
                        onChange={(e) => setRateForm({ ...rateForm, monthly_rate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="如: 50000"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={handleSaveRates}
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存费率'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">可用性设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前状态
                      </label>
                      <select
                        value={availabilityForm.availability_status}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, availability_status: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      >
                        <option value="available">可接单</option>
                        <option value="busy">较忙</option>
                        <option value="unavailable">不可用</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        每周可工作小时数
                      </label>
                      <input
                        type="number"
                        value={availabilityForm.available_hours_per_week}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, available_hours_per_week: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="如: 40"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={handleSaveAvailability}
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存可用性'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SkillModal
        isOpen={showSkillModal}
        onClose={() => {
          setShowSkillModal(false);
          setEditingSkill(null);
        }}
        onSubmit={editingSkill ? handleUpdateSkill : handleAddSkill}
        initialData={editingSkill}
      />

      <ProjectExperienceModal
        isOpen={showExperienceModal}
        onClose={() => {
          setShowExperienceModal(false);
          setEditingExperience(null);
        }}
        onSubmit={editingExperience ? handleUpdateExperience : handleAddExperience}
        initialData={editingExperience}
      />

      <CertificationModal
        isOpen={showCertificationModal}
        onClose={() => {
          setShowCertificationModal(false);
          setEditingCertification(null);
        }}
        onSubmit={editingCertification ? handleUpdateCertification : handleAddCertification}
        initialData={editingCertification}
      />

      <BasicInfoModal
        isOpen={showBasicInfoModal}
        onClose={() => setShowBasicInfoModal(false)}
        onSubmit={handleUpdateBasicInfo}
        initialData={{
          headline: profile?.headline || '',
          summary: profile?.summary || '',
          location: profile?.location || '',
        }}
        saving={saving}
      />
    </PortalLayout>
  );
};

export default ProfilePage;
