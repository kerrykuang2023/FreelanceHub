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
import applicationsService from '@/services/applications.service';
import freelancerProfileService from '@/services/freelancer-profile.service';

interface IProject {
  _id: string;
  project_title: string;
  project_description: string;
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
  project_sub_categories?: string[];
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
      const [projectRes, profileRes] = await Promise.all([
        jobsService.getJobById(id!),
        freelancerProfileService.getMyProfile(),
      ]);
      setProject((projectRes as any).job || projectRes);
      setProfile((profileRes as any).profile || profileRes);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || submitting) return;

    if (!formData.cover_letter.trim()) {
      setError('Please write a cover letter');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await applicationsService.applyForJob(project._id, {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <BriefcaseIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
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
              <h1 className="text-2xl font-bold text-gray-900">{project.project_title}</h1>
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
                  {new Date(project.start_date).toLocaleDateString('zh-CN')}
                </span>
                <span className="flex items-center">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />
                  {project.work_format}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  disabled={submitting || !formData.cover_letter.trim()}
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
  );
};

export default ProjectApplicationPage;
