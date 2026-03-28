import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  MapPinIcon,
  EyeIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import jobsService from '@/services/jobs.service';

interface IJobType {
  _id: string;
  job_type: string;
}

interface IJob {
  _id: string;
  job_type_id: IJobType;
  job_description: string;
  is_company_name_hidden: boolean;
  job_location_id: {
    _id: string;
    street_address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
  is_active: boolean;
  status?: string;
}

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'bg-gray-100 text-gray-700' },
  { value: 'published', label: '已发布', color: 'bg-green-100 text-green-700' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700' },
  { value: 'closed', label: '已关闭', color: 'bg-red-100 text-red-700' },
  { value: 'archived', label: '已归档', color: 'bg-yellow-100 text-yellow-700' },
];

const EditJobPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<IJob | null>(null);
  const [jobTypes, setJobTypes] = useState<IJobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    job_type_id: '',
    job_description: '',
    is_company_name_hidden: false,
    street_address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    status: 'draft',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobRes, typesRes] = await Promise.all([
        jobsService.getJobById(id!),
        jobsService.getJobTypes(),
      ]);
      
      const jobData = (jobRes as any).job || jobRes;
      setJob(jobData);
      setJobTypes((typesRes as any).job_types || []);

      setFormData({
        job_type_id: jobData.job_type_id?._id || jobData.job_type_id || '',
        job_description: jobData.job_description || '',
        is_company_name_hidden: jobData.is_company_name_hidden || false,
        street_address: jobData.job_location_id?.street_address || '',
        city: jobData.job_location_id?.city || '',
        state: jobData.job_location_id?.state || '',
        country: jobData.job_location_id?.country || '',
        zip_code: jobData.job_location_id?.zip_code || '',
        status: jobData.status || 'draft',
      });
    } catch (err) {
      console.error('Failed to load job:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.job_type_id) {
      errors.job_type_id = 'Job type is required';
    }

    if (!formData.job_description.trim()) {
      errors.job_description = 'Job description is required';
    } else if (formData.job_description.length < 20) {
      errors.job_description = 'Job description must be at least 20 characters';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State/Province is required';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

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
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await jobsService.updateJob(id!, {
        job_type_id: formData.job_type_id,
        job_description: formData.job_description,
        is_company_name_hidden: formData.is_company_name_hidden,
        job_location: {
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zip_code: formData.zip_code,
        },
        status: formData.status,
      });

      setSuccess('Job updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update job:', err);
      setError(err.response?.data?.message || 'Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSubmitting(true);
      await jobsService.updateJob(id!, { status: newStatus });
      setFormData((prev) => ({ ...prev, status: newStatus }));
      setSuccess(`Status changed to ${statusOptions.find((s) => s.value === newStatus)?.label}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await jobsService.deleteJob(id!);
      navigate('/my-jobs');
    } catch (err) {
      setError('Failed to delete job');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <BriefcaseIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <button
          onClick={() => navigate('/my-jobs')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <BriefcaseIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
                <p className="text-gray-600">Update project details and status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={submitting}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${
                  statusOptions.find((s) => s.value === formData.status)?.color
                }`}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BriefcaseIcon className="w-4 h-4 inline mr-2 text-gray-400" />
              Job Type *
            </label>
            <select
              name="job_type_id"
              value={formData.job_type_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formErrors.job_type_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a job type</option>
              {jobTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.job_type}
                </option>
              ))}
            </select>
            {formErrors.job_type_id && (
              <p className="mt-1 text-sm text-red-600">{formErrors.job_type_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="w-4 h-4 inline mr-2 text-gray-400" />
              Job Description *
            </label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formErrors.job_description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.job_description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.job_description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_company_name_hidden"
              name="is_company_name_hidden"
              checked={formData.is_company_name_hidden}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_company_name_hidden" className="text-sm text-gray-700">
              <EyeIcon className="w-4 h-4 inline mr-1 text-gray-400" />
              Hide company name from applicants
            </label>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <MapPinIcon className="w-4 h-4 inline mr-2 text-gray-400" />
              Job Location *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.city && <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.country ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center disabled:opacity-50"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
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
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobPage;
