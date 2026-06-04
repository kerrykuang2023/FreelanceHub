import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import PortalLayout from '@/components/layouts/portal/PortalLayout';
import PageHeader from '@/components/core-ui/PageHeader';
import StatCard from '@/components/core-ui/StatCard';
import hrOnboardingService from '@/services/hr-onboarding.service';
import { buttonVariants, inputVariants, cardVariants } from '@/styles/design-tokens';

type OnboardingStep = 'company' | 'profile' | 'review' | 'completed';
const DEFAULT_HR_ROLE = 'HR招聘负责人';

interface OnboardingStatus {
  has_company: boolean;
  has_profile: boolean;
  is_approved: boolean;
  current_step: OnboardingStep;
  company_id?: string;
  company_name?: string;
}

const HROnboardingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('company');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    description: '',
    website: '',
    address: '',
    contact_phone: '',
  });

  const [profileForm, setProfileForm] = useState({
    position: DEFAULT_HR_ROLE,
    department: '',
    recruitment_fields: [] as string[],
    years_of_experience: '',
    summary: '',
  });

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);
      const response = await hrOnboardingService.getOnboardingStatus();
      if (response.success && response.data) {
        setStatus(response.data);
        if (response.data.is_approved) {
          setCurrentStep('completed');
        } else if (response.data.has_profile) {
          setCurrentStep('review');
        } else if (response.data.has_company) {
          setCurrentStep('profile');
        } else {
          setCurrentStep('company');
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCompanies = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      const response = await hrOnboardingService.searchCompanies(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to search companies:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      setSaving(true);
      const response = await hrOnboardingService.joinCompany({
        company_id: selectedCompany._id,
        position: DEFAULT_HR_ROLE,
      });
      if (response.success) {
        setStatus({ ...status!, has_company: true, company_id: selectedCompany._id, company_name: selectedCompany.company_name });
        setCurrentStep('profile');
      }
    } catch (error) {
      console.error('Failed to join company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      setSaving(true);
      const response = await hrOnboardingService.createCompany(companyForm);
      if (response.success) {
        setStatus({ 
          ...status!, 
          has_company: true, 
          company_id: response.data._id, 
          company_name: response.data.company_name 
        });
        setShowCreateForm(false);
        setCurrentStep('profile');
      }
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await hrOnboardingService.saveProfile({
        ...profileForm,
        position: profileForm.position || DEFAULT_HR_ROLE,
      });
      if (response.success) {
        setStatus({ ...status!, has_profile: true });
        setCurrentStep('review');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSaving(true);
      const response = await hrOnboardingService.submitForReview();
      if (response.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to submit for review:', error);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 'company', label: '公司挂靠', icon: BuildingOfficeIcon },
    { id: 'profile', label: '完善资料', icon: UserCircleIcon },
    { id: 'review', label: '提交审核', icon: DocumentTextIcon },
    { id: 'completed', label: '完成入驻', icon: CheckCircleIcon },
  ];

  const recruitmentFields = [
    { id: 'tech', label: '技术' },
    { id: 'design', label: '设计' },
    { id: 'product', label: '产品' },
    { id: 'operation', label: '运营' },
    { id: 'marketing', label: '市场' },
    { id: 'finance', label: '财务' },
    { id: 'hr', label: '人力资源' },
    { id: 'legal', label: '法务' },
  ];

  const companySizes = [
    { value: '1-50', label: '1-50人' },
    { value: '50-200', label: '50-200人' },
    { value: '200-500', label: '200-500人' },
    { value: '500-1000', label: '500-1000人' },
    { value: '1000+', label: '1000人以上' },
  ];

  const industries = [
    '互联网/IT',
    '金融',
    '教育',
    '医疗健康',
    '电商',
    '制造业',
    '房地产',
    '咨询服务',
    '其他',
  ];

  if (loading) {
    return (
      <PortalLayout title="HR入驻">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  if (status?.is_approved) {
    return (
      <PortalLayout title="HR入驻">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">入驻完成！</h1>
          <p className="text-gray-600 mb-8">
            您已成功入驻，可以开始发布职位了。
          </p>
          <button
            onClick={() => navigate('/post-job')}
            className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold ${buttonVariants.primary}`}
          >
            发布第一个职位
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="HR入驻">
      <div className="max-w-4xl mx-auto space-y-6" data-testid="hr-onboarding-page">
        <PageHeader
          title="欢迎加入FreelanceHub"
          description="完成以下步骤，开始您的招聘之旅"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "HR入驻" },
          ]}
        />

        <div className={`${cardVariants.default} p-6`}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      steps.findIndex(s => s.id === currentStep) >= index
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100'
                    }`}
                  >
                    <step.icon className={`w-6 h-6 ${
                      steps.findIndex(s => s.id === currentStep) >= index
                        ? 'text-white'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <span className={`mt-2 text-sm font-medium transition-colors ${
                    steps.findIndex(s => s.id === currentStep) >= index
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 rounded transition-all duration-300 ${
                    steps.findIndex(s => s.id === currentStep) > index
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 'company' && (
          <div className={`${cardVariants.default} p-6`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">选择您的公司</h2>
            
            {!showCreateForm ? (
              <>
                <div className="mb-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchCompanies()}
                      placeholder="搜索公司名称..."
                      className={`pl-12 ${inputVariants.default}`}
                    />
                  </div>
                  <button
                    onClick={searchCompanies}
                    disabled={searching}
                    className={`mt-3 px-6 py-2 rounded-xl font-medium ${buttonVariants.outline}`}
                  >
                    {searching ? '搜索中...' : '搜索'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {searchResults.map((company) => (
                      <div
                        key={company._id}
                        onClick={() => setSelectedCompany(company)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedCompany?._id === company._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            {company.logo_url ? (
                              <img src={company.logo_url} alt={company.company_name} className="w-12 h-12 rounded-xl object-cover" />
                            ) : (
                              <BuildingOfficeIcon className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{company.company_name}</h3>
                            <p className="text-sm text-gray-500">{company.industry} · {company.company_size}</p>
                          </div>
                          {company.verification_status === 'approved' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">已认证</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCompany && (
                  <button
                    onClick={handleJoinCompany}
                    disabled={saving}
                    className={`w-full py-3 rounded-xl font-semibold ${buttonVariants.primary} disabled:opacity-50`}
                  >
                    {saving ? '处理中...' : `申请加入 ${selectedCompany.company_name}`}
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-center text-gray-500 mb-4">没有找到您的公司？</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className={`w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <PlusIcon className="w-5 h-5" />
                    创建新公司
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">创建新公司</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyForm.company_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                      className={inputVariants.default}
                      placeholder="请输入公司全称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所属行业 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={companyForm.industry}
                      onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                      className={inputVariants.default}
                    >
                      <option value="">请选择行业</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司规模 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={companyForm.company_size}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_size: e.target.value })}
                      className={inputVariants.default}
                    >
                      <option value="">请选择规模</option>
                      {companySizes.map((size) => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司网站
                    </label>
                    <input
                      type="url"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      className={inputVariants.default}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司简介 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    rows={4}
                    className={`${inputVariants.default} resize-none`}
                    placeholder="请简要介绍公司业务、文化等..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司地址
                    </label>
                    <input
                      type="text"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      className={inputVariants.default}
                      placeholder="请输入公司详细地址"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系电话
                    </label>
                    <input
                      type="tel"
                      value={companyForm.contact_phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                      className={inputVariants.default}
                      placeholder="请输入公司联系电话"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className={`flex-1 py-3 rounded-xl font-medium ${buttonVariants.secondary}`}
                  >
                    返回搜索
                  </button>
                  <button
                    onClick={handleCreateCompany}
                    disabled={saving || !companyForm.company_name || !companyForm.industry || !companyForm.company_size || !companyForm.description}
                    className={`flex-1 py-3 rounded-xl font-semibold ${buttonVariants.primary} disabled:opacity-50`}
                  >
                    {saving ? '创建中...' : '创建公司'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'profile' && (
          <div className={`${cardVariants.default} p-6`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">完善HR资料</h2>
            <p className="text-gray-500 mb-6">
              已挂靠公司：<span className="text-blue-600 font-medium">{status?.company_name}</span>
            </p>
            
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-800">
                  入驻资料仅用于确认您的企业招聘身份；具体岗位请在入驻完成后到“发布职位”中逐个创建。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在部门
                </label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className={inputVariants.default}
                  placeholder="如：人力资源部、招聘中心"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  招聘领域 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {recruitmentFields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => {
                        const fields = profileForm.recruitment_fields.includes(field.id)
                          ? profileForm.recruitment_fields.filter(f => f !== field.id)
                          : [...profileForm.recruitment_fields, field.id];
                        setProfileForm({ ...profileForm, recruitment_fields: fields });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        profileForm.recruitment_fields.includes(field.id)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HR从业年限
                </label>
                <input
                  type="number"
                  value={profileForm.years_of_experience}
                  onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: e.target.value })}
                  className={inputVariants.default}
                  placeholder="请输入从业年限"
                  min="0"
                  max="50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                <textarea
                  value={profileForm.summary}
                  onChange={(e) => setProfileForm({ ...profileForm, summary: e.target.value })}
                  rows={4}
                  className={`${inputVariants.default} resize-none`}
                  placeholder="介绍您的招聘经验、擅长领域等..."
                />
              </div>
              
              <button
                onClick={handleSaveProfile}
                disabled={saving || profileForm.recruitment_fields.length === 0}
                className={`w-full py-3 rounded-xl font-semibold ${buttonVariants.primary} disabled:opacity-50`}
              >
                {saving ? '保存中...' : '保存并继续'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className={`${cardVariants.default} p-6`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">提交审核</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-500 mb-2">公司信息</h3>
                <p className="text-gray-900 font-medium">{status?.company_name}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-500 mb-2">HR身份信息</h3>
                <p className="text-gray-900">{profileForm.department || '未填写部门'} · 企业招聘负责人</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-500 mb-2">招聘领域</h3>
                <div className="flex flex-wrap gap-2">
                  {profileForm.recruitment_fields.map((fieldId) => {
                    const field = recruitmentFields.find(f => f.id === fieldId);
                    return field ? (
                      <span key={fieldId} className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium">
                        {field.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl mb-6">
              <p className="text-sm text-yellow-800">
                提交后，管理员将对您的信息进行审核。审核通过后，您将可以发布职位。
              </p>
            </div>
            
            <button
              onClick={handleSubmitForReview}
              disabled={saving}
              className={`w-full py-3 rounded-xl font-semibold ${buttonVariants.primary} disabled:opacity-50`}
            >
              {saving ? '提交中...' : '提交审核申请'}
            </button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default HROnboardingPage;
