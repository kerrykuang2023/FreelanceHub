import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookmarkIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import { IJob } from "@/interfaces";

const SAVED_JOBS_KEY = "saved_jobs";

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem(SAVED_JOBS_KEY);
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    const updatedJobs = savedJobs.filter((job) => job._id !== jobId);
    setSavedJobs(updatedJobs);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updatedJobs));
  };

  const handleJobClick = (job: IJob) => {
    navigate(`/jobs/${job._id}`);
  };

  if (loading) {
    return (
      <PortalLayout title="Saved Jobs">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading saved jobs...</div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Saved Jobs">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {savedJobs.length} {savedJobs.length === 1 ? "job" : "jobs"} saved
          </p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookmarkIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Jobs</h3>
            <p className="text-gray-500 mb-6">
              Start saving jobs you're interested in to view them here later.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex gap-4 flex-1 cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="rounded-lg w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                        <BriefcaseIcon className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {job.job_description?.substring(0, 50) || "Job Position"}
                          {job.job_description && job.job_description.length > 50 && "..."}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <BuildingOfficeIcon className="h-4 w-4" />
                          <span>{job.company_id?.company_name || "Company"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4" />
                          <span>
                            {job.job_location_id?.city}, {job.job_location_id?.country}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveJob(job._id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove from saved"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {job.job_type_id?.job_type || "Full-time"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          job.is_active
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : "bg-red-50 text-red-700 ring-red-600/20"
                        }`}
                      >
                        {job.is_active ? "Active" : "Closed"}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>Competitive</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJobClick(job)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default SavedJobsPage;
