import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import JobsService from "@/services/jobs.service";
import Divider from "@/components/core-ui/Divider";
import PageHeader from "@/components/core-ui/PageHeader";
import QuickActionsMenu from "@/components/core-ui/QuickActionsMenu";

const JOB_NATURE_OPTIONS = [
  { value: "full_time", label: "全职" },
  { value: "part_time", label: "兼职" },
  { value: "freelance", label: "自由顾问" },
  { value: "internship", label: "实习" },
];

const WORK_FORMAT_OPTIONS = [
  { value: "remote", label: "远程" },
  { value: "onsite", label: "现场" },
  { value: "hybrid", label: "混合" },
];

const RATE_TYPE_OPTIONS = [
  { value: "negotiable", label: "待面议" },
  { value: "daily", label: "日薪" },
  { value: "monthly", label: "月薪" },
  { value: "yearly", label: "年薪" },
  { value: "project", label: "项目总价" },
];

const CURRENCY_OPTIONS = [
  { value: "CNY", label: "人民币 (CNY)" },
  { value: "USD", label: "美元 (USD)" },
  { value: "EUR", label: "欧元 (EUR)" },
  { value: "GBP", label: "英镑 (GBP)" },
];

const PROJECT_CYCLE_OPTIONS = [
  { value: "1_week", label: "1周以内" },
  { value: "1_month", label: "1个月" },
  { value: "3_months", label: "3个月" },
  { value: "6_months", label: "6个月" },
  { value: "1_year", label: "1年" },
  { value: "long_term", label: "长期" },
];

const PostJobPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    project_title: "",
    project_description: "",
    job_nature: "freelance",
    work_format: "remote",
    rate_type: "daily",
    rate_amount: "",
    rate_currency: "CNY",
    project_cycle: "1_month",
    start_date: "",
    hiring_count: "1",
    is_company_name_hidden: false,
    street_address: "",
    city: "",
    state: "",
    country: "中国",
    zip_code: "",
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.project_title.trim()) {
      errors.project_title = "项目标题是必填项";
    } else if (formData.project_title.length > 200) {
      errors.project_title = "项目标题不能超过200个字符";
    }

    if (!formData.project_description.trim()) {
      errors.project_description = "项目描述是必填项";
    } else if (formData.project_description.length < 20) {
      errors.project_description = "项目描述至少需要20个字符";
    }

    if (!formData.job_nature) errors.job_nature = "工作性质是必填项";
    if (!formData.work_format) errors.work_format = "工作形式是必填项";
    if (!formData.rate_type) errors.rate_type = "费率类型是必填项";
    if (formData.rate_type !== "negotiable" && !formData.rate_amount) {
      errors.rate_amount = "费率金额是必填项";
    }
    if (!formData.project_cycle) errors.project_cycle = "项目周期是必填项";
    if (!formData.city.trim()) errors.city = "城市是必填项";
    if (!formData.country.trim()) errors.country = "国家是必填项";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await JobsService.createJob({
        project_title: formData.project_title,
        project_description: formData.project_description,
        job_nature: formData.job_nature,
        work_format: formData.work_format,
        rate_type: formData.rate_type,
        rate_amount: formData.rate_amount ? Number(formData.rate_amount) : undefined,
        rate_currency: formData.rate_currency,
        project_major_categories: [],
        project_sub_categories: [],
        project_cycle: formData.project_cycle,
        start_date: formData.start_date || undefined,
        hiring_count: Number(formData.hiring_count) || 1,
        is_company_name_hidden: formData.is_company_name_hidden,
        job_location: {
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zip_code: formData.zip_code,
        },
      });

      setSuccess(true);
      setTimeout(() => navigate("/my-jobs"), 1200);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "创建项目失败，请重试";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PortalLayout title="发布项目">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">项目发布成功</h2>
            <p className="text-gray-500 mb-4">正在跳转到我的项目...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="发布项目">
      <div className="w-full space-y-6 pb-8" data-testid="post-job-page">
        <PageHeader
          title="发布新项目"
          description="填写项目详情，创建新的项目需求"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "我的项目", href: "/my-jobs" },
            { label: "发布项目" },
          ]}
        />

        <QuickActionsMenu title="快捷操作" maxItems={4} />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">项目标题 *</label>
                      <input
                        type="text"
                        name="project_title"
                        data-testid="project-title-input"
                        value={formData.project_title}
                        onChange={handleChange}
                        placeholder="输入项目标题"
                        className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.project_title ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                      />
                      {formErrors.project_title && <p className="mt-1 text-sm text-red-600">{formErrors.project_title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">项目描述 *</label>
                      <textarea
                        name="project_description"
                        data-testid="project-description-input"
                        value={formData.project_description}
                        onChange={handleChange}
                        rows={6}
                        placeholder="详细描述项目需求、职责、技能要求等..."
                        className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.project_description ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                      />
                      {formErrors.project_description && <p className="mt-1 text-sm text-red-600">{formErrors.project_description}</p>}
                      <p className="mt-1 text-xs text-gray-500">{formData.project_description.length} / 4000 字符</p>
                    </div>
                  </div>
                </section>

                <Divider />

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">工作详情</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField icon={<ClockIcon />} label="工作性质" name="job_nature" value={formData.job_nature} error={formErrors.job_nature} options={JOB_NATURE_OPTIONS} onChange={handleChange} />
                    <SelectField icon={<MapPinIcon />} label="工作形式" name="work_format" value={formData.work_format} error={formErrors.work_format} options={WORK_FORMAT_OPTIONS} onChange={handleChange} />
                    <SelectField icon={<CalendarIcon />} label="项目周期" name="project_cycle" value={formData.project_cycle} error={formErrors.project_cycle} options={PROJECT_CYCLE_OPTIONS} onChange={handleChange} />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserGroupIcon className="h-4 w-4 inline mr-1" />
                        招聘人数
                      </label>
                      <input
                        type="number"
                        name="hiring_count"
                        value={formData.hiring_count}
                        onChange={handleChange}
                        min="1"
                        className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">预计开始日期</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      />
                    </div>
                  </div>
                </section>

                <Divider />

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">费用</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField icon={<CurrencyDollarIcon />} label="费率类型" name="rate_type" value={formData.rate_type} error={formErrors.rate_type} options={RATE_TYPE_OPTIONS} onChange={handleChange} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        费率金额 {formData.rate_type !== "negotiable" && "*"}
                      </label>
                      <input
                        type="number"
                        name="rate_amount"
                        value={formData.rate_amount}
                        onChange={handleChange}
                        placeholder="输入金额"
                        disabled={formData.rate_type === "negotiable"}
                        className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.rate_amount ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm disabled:bg-gray-100`}
                      />
                      {formErrors.rate_amount && <p className="mt-1 text-sm text-red-600">{formErrors.rate_amount}</p>}
                    </div>
                    <SelectField label="货币" name="rate_currency" value={formData.rate_currency} options={CURRENCY_OPTIONS} onChange={handleChange} />
                  </div>
                </section>

                <Divider />

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">工作地点</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField className="md:col-span-2" label="街道地址" name="street_address" value={formData.street_address} onChange={handleChange} />
                    <TextField label="城市 *" name="city" value={formData.city} error={formErrors.city} onChange={handleChange} />
                    <TextField label="省/州" name="state" value={formData.state} onChange={handleChange} />
                    <TextField label="国家 *" name="country" value={formData.country} error={formErrors.country} onChange={handleChange} />
                    <TextField label="邮编" name="zip_code" value={formData.zip_code} onChange={handleChange} />
                  </div>
                </section>

                <Divider />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_company_name_hidden"
                    name="is_company_name_hidden"
                    checked={formData.is_company_name_hidden}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="is_company_name_hidden" className="text-sm text-gray-700">
                    <EyeIcon className="h-4 w-4 inline mr-1 text-gray-400" />
                    对申请人隐藏公司名称
                  </label>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/my-jobs")}
                    className="rounded-lg px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-job-btn"
                    disabled={submitting}
                    className={`rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors ${
                      submitting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {submitting ? "发布中..." : "发布项目"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

const SelectField = ({
  icon,
  label,
  name,
  value,
  error,
  options,
  onChange,
}: {
  icon?: React.ReactElement;
  label: string;
  name: string;
  value: string;
  error?: string;
  options: { value: string; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {icon && <span className="h-4 w-4 inline-block mr-1 align-text-bottom">{icon}</span>}
      {label} *
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
        error ? "ring-red-300" : "ring-gray-300"
      } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const TextField = ({
  label,
  name,
  value,
  error,
  onChange,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className={`block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
        error ? "ring-red-300" : "ring-gray-300"
      } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default PostJobPage;
