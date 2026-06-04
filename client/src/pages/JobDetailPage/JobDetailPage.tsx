import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import jobsService from "@/services/jobs.service";
import ApplicationsService from "@/services/applications.service";
import { IJob } from "@/interfaces";
import Divider from "@/components/core-ui/Divider";
import { useAuth } from "@/providers";
import PageHeader from "@/components/core-ui/PageHeader";

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, activeRole, roles } = useAuth();
  const [job, setJob] = useState<IJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const currentRoleType = activeRole?.role_type || user?.user_type_name || 'job_seeker';
  const isJobSeeker = currentRoleType === 'job_seeker';
  const isHR = currentRoleType === 'hr_recruiter';
  const isAdmin = currentRoleType === 'admin';
  const isCompanyUser = user?.user_type_name === "company_user";

  useEffect(() => {
    if (id) {
      fetchJob();
      checkIfSaved();
    }
  }, [id]);

  const checkIfSaved = () => {
    const savedJobs = localStorage.getItem('saved_jobs');
    if (savedJobs) {
      const jobs = JSON.parse(savedJobs);
      setSaved(jobs.some((j: IJob) => j._id === id));
    }
  };

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await jobsService.getJobById(id!);
      const jobData = (response as any).job || response;
      setJob(jobData);
    } catch (err) {
      console.error("Failed to fetch job:", err);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job || applying || applied) return;
    
    try {
      setApplying(true);
      await new ApplicationsService().applyForJob(job._id);
      setApplied(true);
      // Show message modal after applying
      setShowMessageModal(true);
    } catch (err) {
      console.error("Failed to apply:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      // TODO: Implement message sending API
      console.log("Sending message to HR:", message);
      setShowMessageModal(false);
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSave = () => {
    const savedJobs = localStorage.getItem('saved_jobs');
    let jobs: IJob[] = savedJobs ? JSON.parse(savedJobs) : [];
    
    if (saved && job) {
      // Remove from saved jobs
      jobs = jobs.filter((j) => j._id !== job._id);
      setSaved(false);
    } else if (job) {
      // Add to saved jobs
      jobs.push(job);
      setSaved(true);
    }
    
    localStorage.setItem('saved_jobs', JSON.stringify(jobs));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.job_description?.substring(0, 50) || "Job Opportunity",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Job Details">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading job details...</div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !job) {
    return (
      <PortalLayout title="Job Details">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-red-500 text-lg">{error || "Job not found"}</div>
          <button
            onClick={() => navigate("/")}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Back to Home
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Job Details">
      <div className="flex-1 max-w-4xl mx-auto w-full" data-testid="job-detail-page">
        <PageHeader
          title={job.job_title || "职位详情"}
          description={job.company_id?.company_name || "查看职位详情"}
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "职位列表", href: "/" },
            { label: "职位详情" },
          ]}
        />
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex gap-x-6 justify-between items-start">
              <div className="flex gap-x-4">
                <div className="rounded-xl w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <BriefcaseIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900" data-testid="job-title">
                    {job.job_title || job.job_description?.substring(0, 60) || "Job Position"}
                    {!job.job_title && job.job_description && job.job_description.length > 60 ? "..." : ""}
                  </h2>
                  <div className="flex items-center gap-x-2 mt-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-lg text-gray-600">
                      {job.company_id?.company_name || "Company"}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-2 mt-1">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {job.job_location_id?.city}, {job.job_location_id?.state}, {job.job_location_id?.country}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ShareIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-full transition-colors ${
                    saved ? "bg-indigo-100" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <BookmarkIcon
                    className={`h-5 w-5 ${saved ? "text-indigo-600 fill-indigo-600" : "text-gray-600"}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {job.job_type_id?.job_type || "Full-time"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                  job.is_active
                    ? "bg-green-50 text-green-700 ring-green-600/20"
                    : "bg-red-50 text-red-700 ring-red-600/20"
                }`}
              >
                {job.is_active ? "Active" : "Closed"}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-600/10">
                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                Competitive Salary
              </span>
            </div>

            <Divider className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                  <p className="text-base font-semibold text-gray-900">
                    {job.job_type_id?.job_type || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Posted Date</h3>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(job.created_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <MapPinIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="text-base font-semibold text-gray-900">
                    {job.job_location_id?.city}, {job.job_location_id?.country}
                  </p>
                </div>
              </div>
            </div>

            <Divider className="my-8" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                {job.job_description ? (
                  <p className="whitespace-pre-wrap">{job.job_description}</p>
                ) : (
                  <p className="text-gray-400 italic">No description available.</p>
                )}
              </div>
            </div>

            <Divider className="my-8" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Street Address:</span>
                    <p className="font-medium text-gray-900">
                      {job.job_location_id?.street_address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">City:</span>
                    <p className="font-medium text-gray-900">{job.job_location_id?.city || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">State/Province:</span>
                    <p className="font-medium text-gray-900">{job.job_location_id?.state || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Country:</span>
                    <p className="font-medium text-gray-900">{job.job_location_id?.country || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ZIP Code:</span>
                    <p className="font-medium text-gray-900">{job.job_location_id?.zip_code || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Divider className="my-8" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {job.company_id?.company_name || "Company"}
                    </h3>
                    {job.company_id?.company_website_url && (
                      <a
                        href={job.company_id.company_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        Visit Website
                      </a>
                    )}
                    {job.company_id?.profile_description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {job.company_id.profile_description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Divider className="my-8" />

            {applied ? (
              <div className="bg-green-50 rounded-lg p-6 flex items-center gap-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Application Submitted!</h3>
                  <p className="text-sm text-green-600">
                    Your application has been successfully submitted. You can track its status in My Jobs.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/my-jobs")}
                  className="ml-auto rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  View My Jobs
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                {isJobSeeker ? (
                  <>
                    <button
                      onClick={() => navigate(`/jobs/${job._id}/apply`)}
                      disabled={!job.is_active}
                      className={`flex-1 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-2 ${
                        job.is_active
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Apply with Details
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={!job.is_active || applying}
                      className={`rounded-lg px-6 py-3 text-base font-semibold shadow-sm transition-colors ${
                        job.is_active && !applying
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {applying ? "Submitting..." : "Quick Apply"}
                    </button>
                  </>
                ) : isCompanyUser ? (
                  <>
                    <button
                      onClick={() => navigate(`/jobs/${job._id}/edit`)}
                      className="flex-1 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                      Edit Project
                    </button>
                    <button
                      onClick={() => navigate("/my-jobs")}
                      className="rounded-lg px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Back to My Jobs
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 rounded-lg px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Back to Jobs
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowMessageModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Send Message to HR
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Attach a message to your application for this position.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dear Hiring Manager, I'm very interested in this position..."
                className="w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                rows={6}
              />
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessage("");
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !message.trim()}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                    sendingMessage || !message.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default JobDetailPage;
