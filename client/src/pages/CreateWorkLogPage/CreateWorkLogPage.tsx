import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import workLogService from "@/services/worklogs.service";
import jobsService from "@/services/jobs.service";
import configsService from "@/services/configs.service";
import { IProjectRequirement } from "@/interfaces/models/jobs";
import { ISystemConfig } from "@/services/admin.service";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

const workLogSchema = Yup.object({
  project_requirement_id: Yup.string().required("请选择项目"),
  work_date: Yup.date().required("请选择工作日期").max(new Date(), "不能填报未来日期"),
  work_period_start: Yup.string().required("请选择开始时间"),
  work_period_end: Yup.string().required("请选择结束时间"),
  hours_worked: Yup.number().required("请输入工时").min(0.5, "最小0.5小时").max(24, "最大24小时"),
  work_type: Yup.string().required("请选择工作类型"),
  work_description: Yup.string().required("请输入工作描述").min(10, "至少10个字符"),
  work_content_detail: Yup.string(),
  notes: Yup.string(),
});

const CreateWorkLogPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [projects, setProjects] = useState<IProjectRequirement[]>([]);
  const [workTypes, setWorkTypes] = useState<ISystemConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadProjects();
    loadWorkTypes();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await workLogService.getAvailableProjects();
      const allProjects = response.projects || response || [];
      setProjects(allProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadWorkTypes = async () => {
    try {
      setLoadingWorkTypes(true);
      const types = await configsService.getWorkTypes();
      setWorkTypes(types.filter(t => t.is_active));
    } catch (error) {
      console.error("Failed to load work types:", error);
    } finally {
      setLoadingWorkTypes(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      project_requirement_id: id || "",
      work_date: new Date().toISOString().split("T")[0],
      work_period_start: "09:00",
      work_period_end: "18:00",
      hours_worked: 8,
      work_type: "",
      work_description: "",
      work_content_detail: "",
      notes: "",
    },
    validationSchema: workLogSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setSubmitError(null);

        const workPeriodStart = `${values.work_date}T${values.work_period_start}:00`;
        const workPeriodEnd = `${values.work_date}T${values.work_period_end}:00`;

        await workLogService.createWorkLog({
          project_requirement_id: values.project_requirement_id,
          work_date: values.work_date,
          work_period_start: workPeriodStart,
          work_period_end: workPeriodEnd,
          hours_worked: values.hours_worked,
          work_type: values.work_type,
          work_description: values.work_description,
          work_content_detail: values.work_content_detail,
          notes: values.notes,
        });

        setSubmitSuccess(true);
        setTimeout(() => {
          navigate("/work-logs");
        }, 1500);
      } catch (error: any) {
        console.error("Failed to create work log:", error);
        setSubmitError(error.response?.data?.message || "创建工时失败，请重试");
      } finally {
        setLoading(false);
      }
    },
  });

  const adjustHours = (delta: number) => {
    const newValue = Math.max(0.5, Math.min(24, formik.values.hours_worked + delta));
    formik.setFieldValue("hours_worked", newValue);
  };

  useEffect(() => {
    const start = new Date(`2000-01-01T${formik.values.work_period_start}`);
    const end = new Date(`2000-01-01T${formik.values.work_period_end}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diff > 0 && diff <= 24) {
      formik.setFieldValue("hours_worked", diff);
    }
  }, [formik.values.work_period_start, formik.values.work_period_end]);

  return (
    <PortalLayout title="填报工时">
      <div className="w-full space-y-6">
        <PageHeader
          title="填报工时"
          description="记录您的工作时间"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "工时管理", href: "/work-logs" },
            { label: "填报工时" },
          ]}
        />

        <div className="card">
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-700 font-medium">✓ 工时创建成功！正在跳转...</p>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <div>
              <label className="label">
                项目 <span className="text-red-500">*</span>
              </label>
              {loadingProjects ? (
                <div className="animate-pulse h-11 bg-gray-100 rounded-lg"></div>
              ) : (
                <select
                  id="project_requirement_id"
                  name="project_requirement_id"
                  data-testid="project-select"
                  value={formik.values.project_requirement_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-field ${
                    formik.touched.project_requirement_id && formik.errors.project_requirement_id
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                >
                  <option value="">请选择项目</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.project_title}
                    </option>
                  ))}
                </select>
              )}
              {formik.touched.project_requirement_id && formik.errors.project_requirement_id && (
                <p className="hint-text text-red-500">{formik.errors.project_requirement_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  工作日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="work_date"
                    name="work_date"
                    data-testid="work-date-input"
                    max={new Date().toISOString().split("T")[0]}
                    value={formik.values.work_date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`input-field pl-10 ${
                      formik.touched.work_date && formik.errors.work_date
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                </div>
                {formik.touched.work_date && formik.errors.work_date && (
                  <p className="hint-text text-red-500">{formik.errors.work_date}</p>
                )}
              </div>

              <div>
                <label className="label">
                  工时 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustHours(-0.5)}
                    className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MinusIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    id="hours_worked"
                    name="hours_worked"
                    data-testid="hours-input"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={formik.values.hours_worked}
                    onChange={formik.handleChange}
                    className={`input-field text-center flex-1 ${
                      formik.touched.hours_worked && formik.errors.hours_worked
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => adjustHours(0.5)}
                    className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-500 font-medium">小时</span>
                </div>
                {formik.touched.hours_worked && formik.errors.hours_worked && (
                  <p className="hint-text text-red-500">{formik.errors.hours_worked}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  开始时间 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    id="work_period_start"
                    name="work_period_start"
                    value={formik.values.work_period_start}
                    onChange={formik.handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  结束时间 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    id="work_period_end"
                    name="work_period_end"
                    value={formik.values.work_period_end}
                    onChange={formik.handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">
                工作类型 <span className="text-red-500">*</span>
              </label>
              {loadingWorkTypes ? (
                <div className="animate-pulse h-11 bg-gray-100 rounded-lg"></div>
              ) : workTypes.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {workTypes.map((type) => (
                    <button
                      key={type._id}
                      type="button"
                      onClick={() => formik.setFieldValue("work_type", type.config_value)}
                      className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                        formik.values.work_type === type.config_value
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {type.display_name}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  id="work_type"
                  name="work_type"
                  value={formik.values.work_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-field ${
                    formik.touched.work_type && formik.errors.work_type
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                >
                  <option value="">请选择工作类型</option>
                  <option value="远程工作">远程工作</option>
                  <option value="现场开发">现场开发</option>
                  <option value="会议">会议</option>
                  <option value="培训">培训</option>
                </select>
              )}
              {formik.touched.work_type && formik.errors.work_type && (
                <p className="hint-text text-red-500">{formik.errors.work_type}</p>
              )}
              {workTypes.length === 0 && !loadingWorkTypes && (
                <p className="hint-text text-amber-600">
                  暂无可用工时类型，请联系管理员配置
                </p>
              )}
            </div>

            <div>
              <label className="label">
                工作描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="work_description"
                name="work_description"
                data-testid="work-description-input"
                rows={4}
                value={formik.values.work_description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="简要描述今天完成的工作内容..."
                className={`input-field ${
                  formik.touched.work_description && formik.errors.work_description
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {formik.touched.work_description && formik.errors.work_description && (
                <p className="hint-text text-red-500">{formik.errors.work_description}</p>
              )}
              <p className="hint-text">至少10个字符</p>
            </div>

            <div>
              <label className="label">
                详细工作内容 <span className="text-gray-400 font-normal">(可选)</span>
              </label>
              <textarea
                id="work_content_detail"
                name="work_content_detail"
                rows={3}
                value={formik.values.work_content_detail}
                onChange={formik.handleChange}
                placeholder="更详细的工作内容..."
                className="input-field"
              />
            </div>

            <div>
              <label className="label">
                备注 <span className="text-gray-400 font-normal">(可选)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={formik.values.notes}
                onChange={formik.handleChange}
                placeholder="其他需要说明的事项..."
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "提交中..." : "提交工时"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CreateWorkLogPage;
