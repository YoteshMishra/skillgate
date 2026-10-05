import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface MyJob {
  id: number;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  createdAt: string;
  _count: {
    applications: number;
  };
}

interface Applicant {
  id: number;
  status: string;
  appliedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const STATUS_OPTIONS = ["PENDING", "REVIEWED", "ACCEPTED", "REJECTED"];

const badgeClassFor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "REVIEWED":
      return "bg-sky-50 text-sky-700 ring-sky-600/20";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
};

const labelFor = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase();

function MyJobs() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await api.get("/jobs/mine");
      setJobs(response.data.jobs);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId: number) => {
    setApplicantsLoading(true);
    try {
      const response = await api.get(`/applications/job/${jobId}`);
      setApplicants(response.data.applications);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load applicants");
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleViewApplicants = async (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    await loadApplicants(jobId);
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    setError("");
    setUpdatingId(applicationId);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                My job postings
              </h2>
              {!loading && jobs.length > 0 && (
                <p className="mt-1 text-sm text-slate-600">
                  {jobs.length} active posting{jobs.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-4" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
                  <div className="mt-6 h-3 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-base font-medium text-slate-900">
                You haven't posted any jobs yet
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Posted roles and their applicants will show up here.
              </p>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <ul className="space-y-4">
              {jobs.map((job) => {
                const isOpen = expandedJobId === job.id;
                const count = job._count.applications;

                return (
                  <li
                    key={job.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-slate-900">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {job.company}
                            {job.location ? ` · ${job.location}` : ""}
                          </p>
                        </div>
                        {job.salary && (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                            {job.salary}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()} ·{" "}
                          <span className="font-medium text-slate-700">
                            {count} applicant{count === 1 ? "" : "s"}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => handleViewApplicants(job.id)}
                          aria-expanded={isOpen}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                        >
                          {isOpen ? "Hide applicants" : "View applicants"}
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                            className={`h-4 w-4 text-slate-500 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-200 bg-slate-50/60">
                        {applicantsLoading && (
                          <p className="px-5 py-6 text-sm text-slate-500 sm:px-6">
                            Loading applicants...
                          </p>
                        )}

                        {!applicantsLoading && applicants.length === 0 && (
                          <p className="px-5 py-6 text-sm text-slate-600 sm:px-6">
                            No applicants yet.
                          </p>
                        )}

                        {!applicantsLoading && applicants.length > 0 && (
                          <ul className="divide-y divide-slate-200">
                            {applicants.map((app) => (
                              <li
                                key={app.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    aria-hidden="true"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700"
                                  >
                                    {app.user.name.charAt(0).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                      {app.user.name}
                                    </p>
                                    <p className="truncate text-sm text-slate-500">
                                      {app.user.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeClassFor(
                                      app.status
                                    )}`}
                                  >
                                    {labelFor(app.status)}
                                  </span>
                                  <select
                                    value={app.status}
                                    disabled={updatingId === app.id}
                                    onChange={(e) =>
                                      handleStatusChange(app.id, e.target.value)
                                    }
                                    aria-label={`Change status for ${app.user.name}`}
                                    className="rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {labelFor(s)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default MyJobs;