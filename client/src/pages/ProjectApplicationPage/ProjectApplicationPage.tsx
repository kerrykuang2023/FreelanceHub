import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import jobsService from '@/services/jobs.service';
import ApplicationsService from '@/services/applications.service';
import freelancerProfileService from '@/services/freelancer-profile.service';
import PortalLayout from '@/components/layouts/portal/PortalLayout';

interface IProject {
  _id: string;
  project_title?: string;
  project_description?: string;
  job_title?: string;
  job_description?: string;
  created_date?: string;
  company_id: {
    _id: string;
    company_name: string;
    logo?: string;
  };
  rate_type: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  start_date: string;
  end_date?: string;
  work_format: string;
  job_type_id?: {
    job_type?: string;
  };
  project_sub_categories?: string[];
  status?: string;
  is_active?: boolean;
}

interface ISkill {
  _id: string;
  skill_name: string;
  skill_level?: string;
  years_of_experience?: number;
}

interface IProfile {
  _id: string;
  freelancer_name: string;
  skills: ISkill[];
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
}

const ProjectApplicationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<IProject | null>(null);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cover_letter: '',
    proposed_rate: '',
    rate_type: 'daily',
    availability_date: '',
    estimated_duration: '',
    relevant_experience: '',
    attachments: [] as string[],
    skills_match: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectRes, profileRes, applicationsRes] = await Promise.all([
        jobsService.getJobById(id!),
        freelancerProfileService.getMyProfile(),
        new ApplicationsService().getUserApplications({ limit: 100 }).catch(() => ({ applications: [] })),
      ]);
      const projectData = (projectRes as any).job || projectRes;
      const applications = (applicationsRes as any).applications || [];
      const currentApplication = applications.find((application: any) => {
        const jobId = application.job_post_id?._id || application.job_post_id;
        return jobId?.toString() === id;
      });
      setProject(projectData);
      setProfile((profileRes as any).profile || profileRes);
      setApplicationStatus(currentApplication?.status || null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || submitting || !canApply) return;

    if (!formData.cover_letter.trim()) {
      setError('Please write a cover letter');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await new ApplicationsService().applyForJob(project._id, {
        cover_letter: formData.cover_letter,
        proposed_rate: formData.proposed_rate ? Number(formData.proposed_rate) : undefined,
        rate_type: formData.rate_type,
        availability_date: formData.availability_date || undefined,
        estimated_duration: formData.estimated_duration || undefined,
        relevant_experience: formData.relevant_experience || undefined,
        skills_match: formData.skills_match,
      });

      navigate('/my-jobs', { state: { message: 'Application submitted successfully!' } });
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const projectStatus = project?.status;
  const isFilled = projectStatus === "in_progress" || projectStatus === "进行中" || applicationStatus === "accepted";
  const isClosed = project?.is_active === false || projectStatus === "closed" || projectStatus === "已关闭" || projectStatus === "expired" || projectStatus === "已到期";
  const canApply = Boolean(project && !isFilled && !isClosed && !applicationStatus);
  const applicationStatusText: Record<string, string> = {
    pending: "您已提交申请，正在等待企业审核。",
    reviewed: "您的申请已被查看，暂不能重复申请。",
    accepted: "您已被录用，请在我的项目中继续后续流程。",
    rejected: "您的申请已被拒绝，不能重复申请。",
    invalidated: "该岗位已录用其他顾问，您的申请已失效。",
    withdrawn: "您已撤回该申请，暂不能重复提交。",
  };
  const unavailableMessage =
    applicationStatus
      ? applicationStatusText[applicationStatus] || "您已申请过该岗位，不能重复申请。"
      : isFilled
      ? "该岗位已录用顾问，不能再申请。"
      : isClosed
      ? "该岗位已关闭，不能再申请。"
      : "";
  const displayTitle = project?.project_title || project?.job_title || "职位详情";
  const displayDate = project?.start_date || project?.created_date;

  const toggleSkill = (skillName: string) => {
    setFormData((prev) => ({
      ...prev,
      skills_match: prev.skills_match.includes(skillName)
        ? prev.skills_match.filter((s) => s !== skillName)
        : [...prev.skills_match, skillName],
    }));
  };

  if (loading) {
    return (
      <PortalLayout title="申请项目">
        <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      </PortalLayout>
    );
  }

  if (!project) {
    return (
      <PortalLayout title="申请项目">
        <div className="flex flex-col items-center justify-center py-20">
        <BriefcaseIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Projects
        </button>
      </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="申请项目">
      <div className="w-full space-y-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 flex items-center"
        >
          <XMarkIcon className="w-5 h-5 mr-1" />
          Cancel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
              {project.company_id?.logo ? (
                <img src={project.company_id.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
              <p className="text-gray-600 mt-1">{project.company_id?.company_name}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  {project.budget_min && project.budget_max
                    ? `${project.currency} ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}`
                    : 'Negotiable'}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {displayDate ? new Date(displayDate).toLocaleDateString('zh-CN') : '待确认'}
                </span>
                <span className="flex items-center">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />
                  {project.work_format || project.job_type_id?.job_type || '待确认'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!canApply && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              {unavailableMessage}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.cover_letter}
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              placeholder="Introduce yourself and explain why you're the best fit for this project..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Highlight your relevant experience and skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Rate
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.proposed_rate}
                  onChange={(e) => setFormData({ ...formData, proposed_rate: e.target.value })}
                  placeholder="Enter rate"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.rate_type}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability Date
              </label>
              <input
                type="date"
                value={formData.availability_date}
                onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                placeholder="e.g., 3 months, 6 weeks"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Experience (years)
              </label>
              <input
                type="text"
                value={formData.relevant_experience}
                onChange={(e) => setFormData({ ...formData, relevant_experience: e.target.value })}
                placeholder="e.g., 5 years"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {profile?.skills && profile.skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matching Skills
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select skills from your profile that match this project
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <button
                    key={skill._id}
                    type="button"
                    onClick={() => toggleSkill(skill.skill_name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.skills_match.includes(skill.skill_name)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill.skill_name}
                    {skill.skill_level && ` (${skill.skill_level})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {project.project_sub_categories && project.project_sub_categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {project.project_sub_categories.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Your application will be sent to {project.company_id?.company_name}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.cover_letter.trim() || !canApply}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectApplicationPage;
