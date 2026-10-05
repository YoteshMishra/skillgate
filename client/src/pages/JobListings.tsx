import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location?: string;
  salary?: string;
  postedBy: {
    id: number;
    name: string;
    email: string;
  };
}

type Option = { value: string; label: string };

const DATE_OPTIONS: Option[] = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past month" },
];

const LOGO_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-400",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

const Svg = ({
  children,
  className = "h-4 w-4",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const SearchIcon = () => (
  <Svg className="h-5 w-5">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);
const PinIcon = () => (
  <Svg>
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
const BuildingIcon = () => (
  <Svg>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4" />
  </Svg>
);
const CheckIcon = () => (
  <Svg>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
const BriefcaseIcon = () => (
  <Svg className="h-7 w-7">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
  </Svg>
);
const ChevronIcon = () => (
  <Svg>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

function FilterSelect({
  value,
  onChange,
  options,
  className = "sm:w-48",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-3 text-left text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
      >
        <span className="truncate">{selected.label}</span>
        <span
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                title={o.label}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`block w-full truncate px-4 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  o.value === value
                    ? "font-semibold text-indigo-600"
                    : "text-slate-700"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobListings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location, company, datePosted]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get("/jobs/filters");
      setLocations(response.data.locations);
      setCompanies(response.data.companies);
    } catch {
      // non-critical, filters just won't populate
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (location) params.location = location;
      if (company) params.company = company;
      if (datePosted) params.datePosted = datePosted;

      const response = await api.get("/jobs", { params });
      setJobs(response.data.jobs);
      setError("");
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    setMessage("");
    setError("");
    setApplyingId(jobId);
    try {
      await api.post("/applications", { jobId });
      setMessage("Application submitted successfully.");
      setAppliedIds((prev) => [...prev, jobId]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to apply");
    } finally {
      setApplyingId(null);
    }
  };

  const handleReset = () => {
    setSearch("");
    setLocation("");
    setCompany("");
    setDatePosted("");
  };

  const hasActiveFilters = Boolean(search || location || company || datePosted);
  const isJobSeeker = user?.role === "JOB_SEEKER";

  const locationOptions: Option[] = [
    { value: "", label: "All locations" },
    ...locations.map((l) => ({ value: l, label: l })),
  ];
  const companyOptions: Option[] = [
    { value: "", label: "All companies" },
    ...companies.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Jobs
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Open roles
          </h1>
          <p className="mt-1 text-slate-500">
            Find your next opportunity by searching and filtering the latest
            openings.
          </p>
        </div>

        {/* Search + filters */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by title, company, or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <FilterSelect
              value={datePosted}
              onChange={setDatePosted}
              options={DATE_OPTIONS}
            />

            <FilterSelect
              value={location}
              onChange={setLocation}
              className="sm:w-64"
              options={locationOptions}
            />

            <FilterSelect
              value={company}
              onChange={setCompany}
              className="sm:w-64"
              options={companyOptions}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Reset filters
              </button>
            )}

            <p className="text-sm text-slate-500 sm:ml-auto">
              {loading
                ? "Searching..."
                : `${jobs.length} job${jobs.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold text-rose-500 transition hover:text-rose-700"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
        {message && (
          <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span className="inline-flex items-center gap-2">
              <CheckIcon />
              {message}
            </span>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-semibold text-emerald-500 transition hover:text-emerald-700"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/4 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-24 rounded-full bg-slate-100" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-4/5 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BriefcaseIcon />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No jobs match your filters
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different keyword or clear your filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Job cards */}
        {!loading && jobs.length > 0 && (
          <div className="mt-6 space-y-4">
            {jobs.map((job) => {
              const alreadyApplied = appliedIds.includes(job.id);
              const applying = applyingId === job.id;
              const gradient = LOGO_GRADIENTS[job.id % LOGO_GRADIENTS.length];

              return (
                <article
                  key={job.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} text-xl font-bold text-white shadow-md`}
                      >
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-indigo-600">
                          {job.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <BuildingIcon />
                            {job.company}
                          </span>
                          {job.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <PinIcon />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {job.salary && (
                      <span className="inline-flex shrink-0 items-center self-start rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {job.postedBy.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-500">
                        Posted by{" "}
                        <span className="font-medium text-slate-700">
                          {job.postedBy.name}
                        </span>
                      </span>
                    </div>

                    {isJobSeeker && (
                      <button
                        type="button"
                        onClick={() => handleApply(job.id)}
                        disabled={alreadyApplied || applying}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                          alreadyApplied
                            ? "cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-600/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        }`}
                      >
                        {alreadyApplied ? (
                          <>
                            <CheckIcon />
                            Applied
                          </>
                        ) : applying ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Applying...
                          </>
                        ) : (
                          "Apply now"
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default JobListings;
