import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import PortalLayout from '@/components/layouts/portal/PortalLayout';
import PageHeader from '@/components/core-ui/PageHeader';
import companyService from '@/services/company.service';
import { buttonVariants, inputVariants, cardVariants } from '@/styles/design-tokens';

interface Company {
  _id: string;
  company_name: string;
  logo_url?: string;
  cover_url?: string;
  industry?: string;
  company_size?: string;
  profile_description?: string;
  company_website_url?: string;
  company_address?: string;
  contact_phone?: string;
  contact_email?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  highlights?: string[];
  stats?: {
    active_jobs: number;
    total_hires: number;
  };
}

const CompanyManagementPage = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'gallery'>('overview');

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    profile_description: '',
    company_website_url: '',
    company_address: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companyService.getMyCompany();
      if (response.success && response.data) {
        setCompany(response.data);
        setFormData({
          company_name: response.data.company_name || '',
          industry: response.data.industry || '',
          company_size: response.data.company_size || '',
          profile_description: response.data.profile_description || '',
          company_website_url: response.data.company_website_url || '',
          company_address: response.data.company_address || '',
          contact_phone: response.data.contact_phone || '',
          contact_email: response.data.contact_email || '',
        });
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await companyService.updateCompany(company!._id, formData);
      if (response.success) {
        setCompany({ ...company!, ...formData });
        setActiveTab('overview');
      }
    } catch (error) {
      console.error('Failed to save company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    try {
      setSaving(true);
      const response = await companyService.uploadLogo(company._id, file);
      if (response.success && response.url) {
        setCompany({ ...company, logo_url: response.url });
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    try {
      setSaving(true);
      const response = await companyService.uploadCover(company._id, file);
      if (response.success && response.url) {
        setCompany({ ...company, cover_url: response.url });
      }
    } catch (error) {
      console.error('Failed to upload cover:', error);
    } finally {
      setSaving(false);
    }
  };

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
      <PortalLayout title="公司管理">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  if (!company) {
    return (
      <PortalLayout title="公司管理">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BuildingOfficeIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无公司信息</h2>
          <p className="text-gray-500 mb-4">请先完成HR入驻流程</p>
          <Link
            to="/hr/onboarding"
            className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold ${buttonVariants.primary}`}
          >
            前往入驻
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="公司管理">
      <div className="space-y-6" data-testid="company-management-page">
        <PageHeader
          title="公司管理"
          description="管理您的公司信息和展示页面"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "公司管理" },
          ]}
          actions={
            <Link
              to="/post-job"
              className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold ${buttonVariants.primary}`}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              发布职位
            </Link>
          }
        />

        <div className={`${cardVariants.default} overflow-hidden`}>
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-cyan-500">
            {company.cover_url && (
              <img
                src={company.cover_url}
                alt="Company cover"
                className="w-full h-full object-cover"
              />
            )}
            <label className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/30 transition-colors">
              <PhotoIcon className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={saving}
              />
            </label>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-12 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.company_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <BuildingOfficeIcon className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
                  <PencilIcon className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="mt-4 sm:mt-0 sm:ml-6 sm:mb-2 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
                  {company.verification_status === 'approved' && (
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-green-500/30">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      已认证
                    </span>
                  )}
                  {company.verification_status === 'pending' && (
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-yellow-500/30">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      待审核
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {company.industry && <span>{company.industry}</span>}
                  {company.company_size && <span>{companySizes.find(s => s.value === company.company_size)?.label}</span>}
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100">
              <nav className="flex gap-8">
                {[
                  { id: 'overview', label: '概览' },
                  { id: 'edit', label: '编辑信息' },
                  { id: 'gallery', label: '图片画廊' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`pb-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">公司简介</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {company.profile_description || '暂无公司简介'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">联系方式</h3>
                      {company.company_address && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <span>{company.company_address}</span>
                        </div>
                      )}
                      {company.contact_phone && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <span>{company.contact_phone}</span>
                        </div>
                      )}
                      {company.contact_email && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <span>{company.contact_email}</span>
                        </div>
                      )}
                      {company.company_website_url && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <a
                            href={company.company_website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {company.company_website_url}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">统计信息</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                          <p className="text-2xl font-bold text-blue-600">
                            {company.stats?.active_jobs || 0}
                          </p>
                          <p className="text-sm text-gray-500">活跃职位</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                          <p className="text-2xl font-bold text-green-600">
                            {company.stats?.total_hires || 0}
                          </p>
                          <p className="text-sm text-gray-500">成功招聘</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        公司名称
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className={inputVariants.default}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        所属行业
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
                        公司规模
                      </label>
                      <select
                        value={formData.company_size}
                        onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
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
                        value={formData.company_website_url}
                        onChange={(e) => setFormData({ ...formData, company_website_url: e.target.value })}
                        className={inputVariants.default}
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司简介
                    </label>
                    <textarea
                      value={formData.profile_description}
                      onChange={(e) => setFormData({ ...formData, profile_description: e.target.value })}
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
                        value={formData.company_address}
                        onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                        className={inputVariants.default}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系电话
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className={inputVariants.default}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-6 py-2.5 rounded-xl font-semibold ${buttonVariants.primary} disabled:opacity-50`}
                    >
                      {saving ? '保存中...' : '保存更改'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">图片画廊功能开发中...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CompanyManagementPage;
