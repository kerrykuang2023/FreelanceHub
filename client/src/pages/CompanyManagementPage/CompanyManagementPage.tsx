import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  CameraIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PortalLayout from '@/components/layouts/portal/PortalLayout';
import PageHeader from '@/components/core-ui/PageHeader';
import companyService from '@/services/company.service';
import { buttonVariants, inputVariants } from '@/styles/design-tokens';

interface Company {
  _id: string;
  id?: string;
  company_name: string;
  logo_url?: string;
  cover_url?: string;
  cover_image_url?: string;
  industry?: string;
  company_size?: string;
  profile_description?: string;
  company_website_url?: string;
  company_address?: string;
  contact_phone?: string;
  contact_email?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  stats?: {
    active_jobs: number;
    total_hires: number;
  };
}

const TEXT = {
  title: '\u516c\u53f8\u7ba1\u7406',
  desc: '\u7ba1\u7406\u516c\u53f8\u5c55\u793a\u4fe1\u606f\u3001\u8054\u7cfb\u65b9\u5f0f\u548c\u54c1\u724c\u56fe\u7247',
  postJob: '\u53d1\u5e03\u804c\u4f4d',
  saved: '\u516c\u53f8\u4fe1\u606f\u5df2\u4fdd\u5b58',
  saveFailed: '\u4fdd\u5b58\u516c\u53f8\u4fe1\u606f\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
  missingName: '\u8bf7\u586b\u5199\u516c\u53f8\u540d\u79f0\u540e\u518d\u4fdd\u5b58\u3002',
  missingId: '\u516c\u53f8\u4fe1\u606f\u7f3a\u5c11\u6709\u6548 ID\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5\u3002',
  noCompany: '\u6682\u65e0\u516c\u53f8\u4fe1\u606f',
  finishOnboarding: '\u8bf7\u5148\u5b8c\u6210 HR \u5165\u9a7b\u6d41\u7a0b',
  goOnboarding: '\u524d\u5f80\u5165\u9a7b',
  verified: '\u5df2\u8ba4\u8bc1',
  pending: '\u5f85\u5ba1\u6838',
  rejected: '\u5df2\u9a73\u56de',
  brandAssets: '\u54c1\u724c\u56fe\u7247',
  coverImage: '\u516c\u53f8\u5c01\u9762',
  logoImage: 'Logo',
  uploadCover: '\u4e0a\u4f20\u5c01\u9762\u56fe',
  uploadLogo: '\u4e0a\u4f20 Logo',
  mediaHint: '\u5efa\u8bae\u5c01\u9762\u56fe\u4f7f\u7528 16:5 \u6bd4\u4f8b\uff0cLogo \u4f7f\u7528\u65b9\u5f62\u56fe\u7247\u3002\u652f\u6301 JPG\u3001PNG\u3001WebP\u3002',
  uploadSuccess: '\u56fe\u7247\u5df2\u4e0a\u4f20',
  uploadFailed: '\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u683c\u5f0f\u6216\u6587\u4ef6\u5927\u5c0f\u540e\u91cd\u8bd5\u3002',
  companyInfo: '\u516c\u53f8\u8d44\u6599',
  companyName: '\u516c\u53f8\u540d\u79f0',
  industry: '\u6240\u5c5e\u884c\u4e1a',
  size: '\u516c\u53f8\u89c4\u6a21',
  website: '\u516c\u53f8\u7f51\u7ad9',
  intro: '\u516c\u53f8\u7b80\u4ecb',
  address: '\u516c\u53f8\u5730\u5740',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  email: '\u8054\u7cfb\u90ae\u7bb1',
  selectIndustry: '\u8bf7\u9009\u62e9\u884c\u4e1a',
  selectSize: '\u8bf7\u9009\u62e9\u89c4\u6a21',
  introPlaceholder: '\u7b80\u8981\u4ecb\u7ecd\u516c\u53f8\u4e1a\u52a1\u3001\u56e2\u961f\u3001\u6587\u5316\u548c\u4f18\u52bf\u3002',
  save: '\u4fdd\u5b58\u66f4\u6539',
  saving: '\u4fdd\u5b58\u4e2d...',
  contact: '\u8054\u7cfb\u4fe1\u606f',
  stats: '\u8fd0\u8425\u6570\u636e',
  activeJobs: '\u6d3b\u8dc3\u804c\u4f4d',
  hires: '\u6210\u529f\u62db\u8058',
  emptyIntro: '\u6682\u65e0\u516c\u53f8\u7b80\u4ecb',
  preview: '\u5c55\u793a\u9884\u89c8',
};

const companySizes = [
  { value: '1-50', label: '1-50\u4eba' },
  { value: '51-200', label: '51-200\u4eba' },
  { value: '201-500', label: '201-500\u4eba' },
  { value: '501-1000', label: '501-1000\u4eba' },
  { value: '1000+', label: '1000\u4eba\u4ee5\u4e0a' },
];

const industries = [
  '\u4e92\u8054\u7f51/IT',
  '\u91d1\u878d',
  '\u6559\u80b2',
  '\u533b\u7597\u5065\u5eb7',
  '\u7535\u5546',
  '\u5236\u9020\u4e1a',
  '\u623f\u5730\u4ea7',
  '\u54a8\u8be2\u670d\u52a1',
  '\u5176\u4ed6',
];

const getAssetUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
};

const CompanyManagementPage = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  const coverUrl = useMemo(
    () => getAssetUrl(company?.cover_image_url || company?.cover_url),
    [company?.cover_image_url, company?.cover_url]
  );
  const logoUrl = useMemo(() => getAssetUrl(company?.logo_url), [company?.logo_url]);
  const companySizeLabel = companySizes.find((item) => item.value === company?.company_size)?.label;

  useEffect(() => {
    loadCompany();
  }, []);

  const syncCompany = (data: Company) => {
    setCompany(data);
    setFormData({
      company_name: data.company_name || '',
      industry: data.industry || '',
      company_size: data.company_size || '',
      profile_description: data.profile_description || '',
      company_website_url: data.company_website_url || '',
      company_address: data.company_address || '',
      contact_phone: data.contact_phone || '',
      contact_email: data.contact_email || '',
    });
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companyService.getMyCompany();
      if (response.success && response.data) {
        syncCompany(response.data);
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyId = () => company?._id || company?.id;

  const handleSave = async () => {
    if (!company) return;
    if (!formData.company_name.trim()) {
      setErrorMessage(TEXT.missingName);
      return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
      setErrorMessage(TEXT.missingId);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await companyService.updateCompany(companyId, {
        ...formData,
        company_name: formData.company_name.trim(),
      });
      if (response.success && response.data) {
        syncCompany(response.data);
        setSuccessMessage(response.message || TEXT.saved);
      } else {
        setErrorMessage(response.message || TEXT.saveFailed);
      }
    } catch (error) {
      console.error('Failed to save company:', error);
      setErrorMessage(TEXT.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'cover', file?: File) => {
    if (!file || !company) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setErrorMessage(TEXT.missingId);
      return;
    }

    try {
      setUploading(type);
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = type === 'logo'
        ? await companyService.uploadLogo(companyId, file)
        : await companyService.uploadCover(companyId, file);

      if (response.success && response.url) {
        setCompany({
          ...company,
          ...(type === 'logo'
            ? { logo_url: response.url }
            : { cover_url: response.url, cover_image_url: response.url }),
        });
        setSuccessMessage(TEXT.uploadSuccess);
      } else {
        setErrorMessage(TEXT.uploadFailed);
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      setErrorMessage(TEXT.uploadFailed);
    } finally {
      setUploading(null);
      if (type === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
      if (type === 'cover' && coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const verificationBadge = () => {
    if (!company) return null;
    if (company.verification_status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircleIcon className="h-4 w-4" />
          {TEXT.verified}
        </span>
      );
    }
    if (company.verification_status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {TEXT.rejected}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
        <ShieldCheckIcon className="h-4 w-4" />
        {TEXT.pending}
      </span>
    );
  };

  if (loading) {
    return (
      <PortalLayout title={TEXT.title}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </PortalLayout>
    );
  }

  if (!company) {
    return (
      <PortalLayout title={TEXT.title}>
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-950">{TEXT.noCompany}</h2>
          <p className="mb-5 text-gray-500">{TEXT.finishOnboarding}</p>
          <Link to="/hr/onboarding" className={`inline-flex rounded-xl px-6 py-3 font-semibold ${buttonVariants.primary}`}>
            {TEXT.goOnboarding}
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title={TEXT.title}>
      <div className="space-y-6" data-testid="company-management-page">
        <PageHeader
          title={TEXT.title}
          description={TEXT.desc}
          breadcrumbs={[
            { label: '\u9996\u9875', href: '/' },
            { label: TEXT.title },
          ]}
          actions={
            <Link to="/post-job" className={`inline-flex items-center rounded-xl px-4 py-2 font-semibold ${buttonVariants.primary}`}>
              <PlusIcon className="mr-2 h-5 w-5" />
              {TEXT.postJob}
            </Link>
          }
        />

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" data-testid="company-success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="company-error-message">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="relative h-56 bg-gray-900">
            {coverUrl ? (
              <img src={coverUrl} alt={TEXT.coverImage} className="h-full w-full object-cover" data-testid="company-cover-image" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
                <SparklesIcon className="h-14 w-14 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={Boolean(uploading)}
              className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
              data-testid="upload-cover-button"
            >
              <PhotoIcon className="h-4 w-4" />
              {uploading === 'cover' ? TEXT.saving : TEXT.uploadCover}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleImageUpload('cover', event.target.files?.[0])}
              data-testid="cover-file-input"
            />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-28 w-28 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                  {logoUrl ? (
                    <img src={logoUrl} alt={company.company_name} className="h-full w-full object-cover" data-testid="company-logo-image" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                      <BuildingOfficeIcon className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={Boolean(uploading)}
                    className="absolute bottom-2 right-2 rounded-lg bg-white p-2 text-gray-700 shadow transition hover:bg-gray-50 disabled:opacity-60"
                    aria-label={TEXT.uploadLogo}
                    data-testid="upload-logo-button"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => handleImageUpload('logo', event.target.files?.[0])}
                    data-testid="logo-file-input"
                  />
                </div>

                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-950">{company.company_name}</h1>
                    {verificationBadge()}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {[company.industry, companySizeLabel].filter(Boolean).join(' · ') || TEXT.emptyIntro}
                  </p>
                </div>
              </div>

              <p className="max-w-xl rounded-lg bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600">
                {TEXT.mediaHint}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-950">{TEXT.companyInfo}</h2>
              <span className="text-sm text-gray-500">{TEXT.preview}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.companyName}</span>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(event) => setFormData({ ...formData, company_name: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-name-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.industry}</span>
                <select
                  value={formData.industry}
                  onChange={(event) => setFormData({ ...formData, industry: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-industry-select"
                >
                  <option value="">{TEXT.selectIndustry}</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.size}</span>
                <select
                  value={formData.company_size}
                  onChange={(event) => setFormData({ ...formData, company_size: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-size-select"
                >
                  <option value="">{TEXT.selectSize}</option>
                  {companySizes.map((size) => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.website}</span>
                <input
                  type="url"
                  value={formData.company_website_url}
                  onChange={(event) => setFormData({ ...formData, company_website_url: event.target.value })}
                  className={inputVariants.default}
                  placeholder="https://www.example.com"
                  data-testid="company-website-input"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700">{TEXT.intro}</span>
              <textarea
                value={formData.profile_description}
                onChange={(event) => setFormData({ ...formData, profile_description: event.target.value })}
                rows={5}
                className={`${inputVariants.default} resize-none`}
                placeholder={TEXT.introPlaceholder}
                data-testid="company-description-input"
              />
            </label>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2 md:col-span-1">
                <span className="text-sm font-medium text-gray-700">{TEXT.address}</span>
                <input
                  type="text"
                  value={formData.company_address}
                  onChange={(event) => setFormData({ ...formData, company_address: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-address-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.phone}</span>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(event) => setFormData({ ...formData, contact_phone: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-phone-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{TEXT.email}</span>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(event) => setFormData({ ...formData, contact_email: event.target.value })}
                  className={inputVariants.default}
                  data-testid="company-email-input"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || Boolean(uploading)}
                className={`rounded-xl px-6 py-2.5 font-semibold ${buttonVariants.primary} disabled:opacity-50`}
                data-testid="save-company-button"
              >
                {saving ? TEXT.saving : TEXT.save}
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-950">{TEXT.contact}</h2>
              <div className="space-y-3 text-sm text-gray-600">
                {company.company_address && (
                  <div className="flex gap-3">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <span>{company.company_address}</span>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="flex gap-3">
                    <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <span>{company.contact_phone}</span>
                  </div>
                )}
                {company.contact_email && (
                  <div className="flex gap-3">
                    <EnvelopeIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <span>{company.contact_email}</span>
                  </div>
                )}
                {company.company_website_url && (
                  <div className="flex gap-3">
                    <GlobeAltIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <a href={company.company_website_url} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 hover:text-blue-700">
                      {company.company_website_url}
                    </a>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-950">{TEXT.stats}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-2xl font-bold text-blue-700">{company.stats?.active_jobs || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">{TEXT.activeJobs}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-2xl font-bold text-emerald-700">{company.stats?.total_hires || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">{TEXT.hires}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CompanyManagementPage;
