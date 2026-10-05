import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface Application {
  id: number;
  status: string;
  appliedAt: string;
  job: {
    id: number;
    title: string;
    company: string;
    location?: string;
  };
}

type Status = "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED";
type Filter = "ALL" | Status;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "REVIEWED", label: "Reviewed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "REJECTED", label: "Rejected" },
];

// Full class names so Tailwind can detect them
const STATUS_STYLES: Record<Status, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  REVIEWED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const STATUS_DOT: Record<Status, string> = {
  PENDING: "bg-amber-500",
  REVIEWED: "bg-blue-500",
  ACCEPTED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    {children}
  </svg>
);

const BriefcaseIcon = () => (
  <Icon>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </Icon>
);
const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Icon>
);
const SparkIcon = () => (
  <Icon>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </Icon>
);

function getUserName(): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.name?.split(" ")[0] || "there";
  } catch {
    return "there";
  }
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get("/applications/me");
      setApplications(response.data.applications);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      ALL: applications.length,
      PENDING: 0,
      REVIEWED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
    };
    applications.forEach((a) => {
      if (a.status in c) c[a.status as Status]++;
    });
    return c;
  }, [applications]);

  const visible =
    filter === "ALL"
      ? applications
      : applications.filter((a) => a.status === filter);

  const stats = [
    {
      label: "Total applications",
      value: counts.ALL,
      icon: <BriefcaseIcon />,
      iconStyle: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Pending",
      value: counts.PENDING,
      icon: <ClockIcon />,
      iconStyle: "bg-amber-50 text-amber-600",
    },
    {
      label: "Reviewed",
      value: counts.REVIEWED,
      icon: <EyeIcon />,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      label: "Accepted",
      value: counts.ACCEPTED,
      icon: <CheckIcon />,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {getUserName()}
            </h1>
            <p className="mt-1 text-slate-500">
              Track your applications and keep your job search moving.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white! shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Browse jobs
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconStyle}`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-slate-900">
                  {loading ? "–" : s.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* AI Resume Analyzer banner */}
        <section className="relative mt-6 overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 p-8 text-white shadow-lg shadow-indigo-600/20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-violet-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <span className="h-4 w-4">
                  <SparkIcon />
                </span>
                AI powered
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white!">
                See how your resume matches your target role
              </h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100!">
                Upload your PDF resume and get a match score, missing skills and
                personalised recommendations in seconds.
              </p>
            </div>
            <Link
              to="/resume-analyzer"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700! shadow-sm transition hover:bg-indigo-50"
            >
              Analyze my resume
            </Link>
          </div>
        </section>

        {/* Applications */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                My applications
              </h2>
              <p className="text-sm text-slate-500">
                {loading
                  ? "Loading..."
                  : `${counts.ALL} application${counts.ALL === 1 ? "" : "s"} in total`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded-full px-1.5 text-xs ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <ul className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-4 px-6 py-5">
                  <div className="h-12 w-12 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/4 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </li>
              ))}
            </ul>
          )}

          {/* Empty state */}
          {!loading && applications.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BriefcaseIcon />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No applications yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                When you apply to a job, it will show up here.
              </p>
              <Link
                to="/jobs"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white! transition hover:bg-indigo-500"
              >
                Find your first job
              </Link>
            </div>
          )}

          {!loading && applications.length > 0 && visible.length === 0 && (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              No applications with this status.
            </p>
          )}

          {/* List */}
          {!loading && visible.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {visible.map((app) => {
                const status = (app.status in STATUS_STYLES
                  ? app.status
                  : "PENDING") as Status;
                return (
                  <li
                    key={app.id}
                    className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                        {app.job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {app.job.title}
                        </h3>
                        <p className="truncate text-sm text-slate-500">
                          {app.job.company}
                          {app.job.location ? ` · ${app.job.location}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                        {formatStatus(app.status)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;