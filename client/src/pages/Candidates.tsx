import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import api, { API_ORIGIN } from "../api/axios";
import Navbar from "../components/Navbar";

interface CandidateProfile {
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string;
  education?: string;
  experience?: string;
  resumeUrl?: string;
  resumeName?: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profile: CandidateProfile;
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-400",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

const MAX_SKILL_CHIPS = 8;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function splitSkills(skills?: string) {
  if (!skills) return [];
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const Svg = ({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) => (
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
const MailIcon = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
const PhoneIcon = () => (
  <Svg>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </Svg>
);
const DocIcon = () => (
  <Svg>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);
const UsersIcon = () => (
  <Svg className="h-7 w-7">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0113 0" />
    <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.2A6.5 6.5 0 0121.5 20" />
  </Svg>
);

const selectClass =
  "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 sm:w-56";

function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, skills, location]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get("/candidates/filters");
      setSkillOptions(response.data.skills);
      setLocationOptions(response.data.locations);
    } catch {
      // non-critical
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (skills) params.skills = skills;
      if (location) params.location = location;

      const response = await api.get("/candidates", { params });
      setCandidates(response.data.candidates);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch("");
    setSkills("");
    setLocation("");
  };

  const hasActiveFilters = Boolean(search || skills || location);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Recruiter
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Find candidates
          </h1>
          <p className="mt-1 text-slate-500">
            Search profiles by name, skills or summary, and filter by skill and
            location.
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
              placeholder="Search by name, skills, or summary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <select
                className={selectClass}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              >
                <option value="">All skills</option>
                {skillOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Svg>
                  <path d="M6 9l6 6 6-6" />
                </Svg>
              </span>
            </div>

            <div className="relative">
              <select
                className={selectClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">All locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Svg>
                  <path d="M6 9l6 6 6-6" />
                </Svg>
              </span>
            </div>

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
                : `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-5/6 rounded bg-slate-100" />
                </div>
                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-slate-100" />
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                  <div className="h-6 w-14 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && candidates.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UsersIcon />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No candidates match your filters
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term or clear your filters.
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

        {/* Candidate cards */}
        {!loading && candidates.length > 0 && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {candidates.map((c) => {
              const skillList = splitSkills(c.profile.skills);
              const shownSkills = skillList.slice(0, MAX_SKILL_CHIPS);
              const extra = skillList.length - shownSkills.length;
              const gradient = AVATAR_GRADIENTS[c.id % AVATAR_GRADIENTS.length];

              return (
                <article
                  key={c.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  {/* Top: avatar + identity */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} text-lg font-bold text-white shadow-md`}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {c.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex min-w-0 items-center gap-1.5 transition hover:text-indigo-600"
                        >
                          <MailIcon />
                          <span className="truncate">{c.email}</span>
                        </a>
                        {c.profile.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <PinIcon />
                            {c.profile.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {c.profile.summary && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {c.profile.summary}
                    </p>
                  )}

                  {/* Skills */}
                  {shownSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {shownSkills.map((skill, i) => (
                        <span
                          key={`${skill}-${i}`}
                          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10"
                        >
                          {skill}
                        </span>
                      ))}
                      {extra > 0 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          +{extra} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Experience + education */}
                  {(c.profile.experience || c.profile.education) && (
                    <dl className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                      {c.profile.experience && (
                        <div className="min-w-0">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Experience
                          </dt>
                          <dd className="mt-1 line-clamp-2 text-slate-700">
                            {c.profile.experience}
                          </dd>
                        </div>
                      )}
                      {c.profile.education && (
                        <div className="min-w-0">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Education
                          </dt>
                          <dd className="mt-1 line-clamp-2 text-slate-700">
                            {c.profile.education}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {/* Footer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      {c.profile.phone ? (
                        <>
                          <PhoneIcon />
                          {c.profile.phone}
                        </>
                      ) : (
                        <span className="text-slate-400">No phone added</span>
                      )}
                    </span>

                    {c.profile.resumeUrl ? (
                      <a
                        href={`${API_ORIGIN}${c.profile.resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-600/40"
                      >
                        <DocIcon />
                        View resume
                      </a>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
                        No resume
                      </span>
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

export default Candidates;