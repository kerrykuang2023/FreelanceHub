import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import JobsService from "@/services/jobs.service";
import Divider from "@/components/core-ui/Divider";

interface IJobType {
  _id: string;
  job_type: string;
}

const PostJobPage = () => {
  const navigate = useNavigate();
  const [jobTypes, setJobTypes] = useState<IJobType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    job_type_id: "",
    job_description: "",
    is_company_name_hidden: false,
    street_address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchJobTypes = async () => {
    try {
      setLoading(true);
      const response = await new JobsService().getJobTypes();
      const types = (response as any).job_types || response.job_types || [];
      setJobTypes(types);
      if (types.length > 0) {
        setFormData((prev) => ({
          ...prev,
          job_type_id: types[0]._id,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch job types:", err);
      setError("Failed to load job types");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.job_type_id) {
      errors.job_type_id = "Job type is required";
    }

    if (!formData.job_description.trim()) {
      errors.job_description = "Job description is required";
    } else if (formData.job_description.length < 20) {
      errors.job_description = "Job description must be at least 20 characters";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.state.trim()) {
      errors.state = "State/Province is required";
    }

    if (!formData.country.trim()) {
      errors.country = "Country is required";
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
      [name]: type === "checkbox" ? checked : value,
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

    // Ensure job_type_id is valid
    if (!formData.job_type_id || formData.job_type_id.trim() === "") {
      setError("Please select a valid job type");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
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
      };

      await new JobsService().createJob(payload);
      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to create job:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create job. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Post a Job">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading...</div>
        </div>
      </PortalLayout>
    );
  }

  if (success) {
    return (
      <PortalLayout title="Post a Job">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h2>
            <p className="text-gray-500 mb-4">
              Your job has been posted. Redirecting to home page...
            </p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Post a Job">
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="rounded-xl w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                <BriefcaseIcon className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
                <p className="text-sm text-gray-500">
                  Fill in the details below to create a new job listing
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <BriefcaseIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                    Job Type *
                  </label>
                  <select
                    name="job_type_id"
                    value={formData.job_type_id}
                    onChange={handleChange}
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                      formErrors.job_type_id ? "ring-red-300" : "ring-gray-300"
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <DocumentTextIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                    Job Description *
                  </label>
                  <textarea
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Describe the job position, requirements, responsibilities, and any other relevant information..."
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                      formErrors.job_description ? "ring-red-300" : "ring-gray-300"
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  />
                  {formErrors.job_description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.job_description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.job_description.length} characters (minimum 20)
                  </p>
                </div>

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
                    Hide company name from applicants
                  </label>
                </div>

                <Divider />

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    <MapPinIcon className="h-4 w-4 inline mr-2 text-gray-400" />
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
                        placeholder="123 Main Street"
                        className="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New York"
                        className={`block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.city ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="NY"
                        className={`block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.state ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                      />
                      {formErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="United States"
                        className={`block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                          formErrors.country ? "ring-red-300" : "ring-gray-300"
                        } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                      />
                      {formErrors.country && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleChange}
                        placeholder="10001"
                        className="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-lg px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors ${
                      submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {submitting ? "Posting..." : "Post Job"}
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

export default PostJobPage;
