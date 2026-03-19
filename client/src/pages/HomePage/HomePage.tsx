import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import Divider from "@/components/core-ui/Divider";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import JobsService from "@/services/jobs.service";
import { IJob } from "@/interfaces";
import { useAuth } from "@/providers";

const SAVED_JOBS_KEY = "saved_jobs";

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  
  const isHR = user?.user_type_name === "hr_recruiter";

  useEffect(() => {
    fetchJobs();
    loadSavedJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      console.log("Fetching jobs...");
      const service = new JobsService();
      console.log("JobsService created, calling getJobs...");
      const response = await service.getJobs({ limit: 20 });
      console.log("Response received:", response);
      // axios returns data directly, not wrapped in .data
      const jobs = (response as any).jobs || response.jobs || [];
      console.log("Jobs extracted:", jobs);
      setJobs(jobs);
      if (jobs.length > 0) {
        setSelectedJob(jobs[0]);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = () => {
    try {
      const saved = localStorage.getItem(SAVED_JOBS_KEY);
      if (saved) {
        const savedJobs: IJob[] = JSON.parse(saved);
        setSavedJobIds(new Set(savedJobs.map((j) => j._id)));
      }
    } catch (error) {
      console.error("Failed to load saved jobs:", error);
    }
  };

  const handleJobClick = (job: IJob) => {
    setSelectedJob(job);
  };

  const handleApplyNow = () => {
    if (selectedJob) {
      navigate(`/jobs/${selectedJob._id}`);
    }
  };

  const handlePostJob = () => {
    if (isHR) {
      navigate("/post-job");
    } else {
      navigate("/");
    }
  };

  const handleSaveJob = (e: React.MouseEvent, job: IJob) => {
    e.stopPropagation();
    
    const saved = localStorage.getItem(SAVED_JOBS_KEY);
    let savedJobs: IJob[] = saved ? JSON.parse(saved) : [];

    if (savedJobIds.has(job._id)) {
      savedJobs = savedJobs.filter((j) => j._id !== job._id);
      setSavedJobIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(job._id);
        return newSet;
      });
    } else {
      savedJobs.push(job);
      setSavedJobIds((prev) => new Set(prev).add(job._id));
    }
    
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
  };

  const handleShare = (e: React.MouseEvent, job: IJob) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: job.job_description?.substring(0, 50) || "Job Opportunity",
        url: `${window.location.origin}/jobs/${job._id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/jobs/${job._id}`);
    }
  };

  return (
    <PortalLayout title="Home">
      <div className="flex gap-x-6">
        <aside className="sticky top-24 hidden w-80 shrink-0 xl:block">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900">Filters</h4>
              <div className="py-5"><Divider /></div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Sort By</h5>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "most-recent", name: "Most Recent" },
                    { id: "a-z", name: "A-Z" },
                    { id: "top-salary", name: "Top Salary" },
                    { id: "trending", name: "Trending" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center gap-x-2">
                      <input
                        id={item.id}
                        name="sort-by"
                        type="radio"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <label htmlFor={item.id} className="text-sm text-gray-900">
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="py-5"><Divider /></div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Salary</h5>
                <div className="flex gap-x-4">
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-1/2"
                    placeholder="Min"
                  />
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-1/2"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div className="py-5"><Divider /></div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Job Type</h5>
                <div className="grid grid-cols-2 gap-4">
                  {["Full-time", "Part-time", "Remote", "Volunteer"].map((item) => (
                    <div key={item} className="flex items-center gap-x-2">
                      <input
                        id={item}
                        name={item}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <label htmlFor={item} className="text-sm text-gray-900">{item}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex gap-x-4 justify-between mb-4">
            <div className="flex gap-x-4">
              <div className="relative rounded-md shadow-sm w-80">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full h-10 rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Search Jobs"
                />
              </div>
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Search
              </button>
            </div>
            <button
              type="button"
              onClick={handlePostJob}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 ${
                isHR ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600"
              }`}
            >
              {isHR ? "+ Post a Job" : "Find Jobs"}
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
            <span className="text-sm text-gray-500">{jobs.length} Results Found</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">No jobs found</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobClick(job)}
                  className={`overflow-hidden rounded-lg bg-white shadow cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedJob?._id === job._id ? "border-2 border-indigo-600" : ""
                  }`}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex gap-x-4 justify-between">
                      <div className="flex gap-x-2">
                        <div className="rounded w-12 h-12 bg-gray-200 flex items-center justify-center">
                          <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {job.job_description?.substring(0, 30) || "Job Position"}...
                          </h4>
                          <p className="text-sm text-gray-500">
                            {job.company_id?.company_name || "Company"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {job.job_location_id?.city}, {job.job_location_id?.country}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleSaveJob(e, job)}
                        className={`transition-colors ${
                          savedJobIds.has(job._id)
                            ? "text-indigo-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <BookmarkIcon
                          className={`h-5 w-5 ${
                            savedJobIds.has(job._id) ? "fill-indigo-600" : ""
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex gap-x-2 mt-2">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-600/10">
                        {job.job_type_id?.job_type || "Full-time"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-600/10">
                        {job.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-x-2 mt-2 justify-between">
                      <div className="flex items-center gap-x-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm text-gray-500">Competitive</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(job.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="sticky top-24 hidden w-80 shrink-0 xl:block">
          {selectedJob && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex gap-x-4 justify-between">
                  <div className="rounded w-16 h-16 bg-gray-200 flex items-center justify-center">
                    <BriefcaseIcon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div className="flex gap-4 items-start">
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, selectedJob)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSaveJob(e, selectedJob)}
                      className={`transition-colors ${
                        savedJobIds.has(selectedJob._id)
                          ? "text-indigo-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <BookmarkIcon
                        className={`h-5 w-5 ${
                          savedJobIds.has(selectedJob._id) ? "fill-indigo-600" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedJob.job_description?.substring(0, 50) || "Job Position"}...
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedJob.company_id?.company_name || "Company"} - {selectedJob.job_location_id?.city}
                  </p>
                </div>

                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs mt-2 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {selectedJob.job_type_id?.job_type || "Full-time"}
                </span>

                <div className="py-5"><Divider /></div>

                <div className="flex gap-4 flex-col">
                  <div className="flex gap-x-4 justify-between">
                    <div>
                      <h3 className="text-sm text-gray-900 font-semibold mb-2">Job Type</h3>
                      <p className="text-sm text-gray-400">{selectedJob.job_type_id?.job_type || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-900 font-semibold mb-2">Status</h3>
                      <p className="text-sm text-gray-400">{selectedJob.is_active ? "Active" : "Closed"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-900 font-semibold mb-2">Location</h3>
                    <p className="text-sm text-gray-400">
                      {selectedJob.job_location_id?.city}, {selectedJob.job_location_id?.state}, {selectedJob.job_location_id?.country}
                    </p>
                  </div>
                </div>

                <div className="py-5"><Divider /></div>

                <div>
                  <h3 className="text-sm text-gray-900 font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-500 line-clamp-4">
                    {selectedJob.job_description || "No description available."}
                  </p>
                </div>

                <div className="py-5"><Divider /></div>

                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  View Details & Apply
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </PortalLayout>
  );
};

export default HomePage;
