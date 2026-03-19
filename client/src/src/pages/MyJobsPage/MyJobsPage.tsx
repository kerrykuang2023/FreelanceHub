import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import ApplicationsService from "@/services/applications.service";
import { IApplication } from "@/interfaces/models/users";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  accepted: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const MyJobsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await new ApplicationsService().getUserApplications({ limit: 50 });
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load your applications");
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <PortalLayout title="My Jobs">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading your applications...</div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="My Jobs">
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Job Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your job applications
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "reviewed", label: "Reviewed" },
                { key: "accepted", label: "Accepted" },
                { key: "rejected", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 py-4 px-1 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activeTab === tab.key
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusCounts[tab.key as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === "all" ? "No Applications Yet" : `No ${activeTab} Applications`}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "all"
                ? "Start applying to jobs to see them here."
                : `You don't have any ${activeTab} applications.`}
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
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/jobs/${application.job_post_id._id}`)}
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="rounded-lg w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                        <BriefcaseIcon className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {application.job_post_id?.job_description?.substring(0, 50) || "Job Position"}
                          {application.job_post_id?.job_description &&
                            application.job_post_id.job_description.length > 50 &&
                            "..."}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <BuildingOfficeIcon className="h-4 w-4" />
                          <span>{application.job_post_id?.company_id?.company_name || "Company"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4" />
                          <span>
                            {application.job_post_id?.job_location_id?.city},{" "}
                            {application.job_post_id?.job_location_id?.country}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                        statusColors[application.status]
                      }`}
                    >
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Applied:{" "}
                        {new Date(application.apply_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>{application.job_post_id?.job_type_id?.job_type || "N/A"}</span>
                    </div>
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

export default MyJobsPage;
