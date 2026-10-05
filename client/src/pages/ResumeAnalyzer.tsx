import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { analyzeResume } from "../services/aiService";
import type { ResumeAnalysis } from "../services/aiService";

const ROLES = [
  "Frontend Developer",
  "React.js Developer",
  "Full Stack Developer",
  "JavaScript Developer",
  "Software Developer",
];

const LOADING_STEPS = [
  "Reading your resume...",
  "Extracting your skills...",
  "Comparing with the role requirements...",
  "Writing personalised recommendations...",
];

const MAX_SIZE = 5 * 1024 * 1024;
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getTone(percent: number) {
  if (percent >= 75) {
    return {
      label: "Strong match",
      stroke: "#10b981",
      glow: "shadow-emerald-500/30",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    };
  }
  if (percent >= 50) {
    return {
      label: "Good match",
      stroke: "#f59e0b",
      glow: "shadow-amber-500/30",
      badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    };
  }
  return {
    label: "Needs work",
    stroke: "#f43f5e",
    glow: "shadow-rose-500/30",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ResumeAnalyzer = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState(ROLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Cycle the loading messages
  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [loading]);

  // Count the score up from 0
  useEffect(() => {
    if (!result) {
      setAnimatedPercent(0);
      return;
    }
    const target = result.matchPercentage;
    const duration = 1200;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [result]);

  // Scroll to results when they arrive
  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleFile = (selected: File | null) => {
    setError("");
    setResult(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }
    setFile(selected);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select your resume PDF.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const analysis = await analyzeResume(file, targetRole);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tone = result ? getTone(result.matchPercentage) : null;
  const ringOffset =
    RING_CIRCUMFERENCE - (animatedPercent / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-indigo-50/60 to-violet-50">
      {/* Custom animations */}
      <style>{`
        @keyframes ra-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ra-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.05); }
        }
        @keyframes ra-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ra-fade-up { animation: ra-fade-up 0.55s ease both; }
        .ra-float { animation: ra-float 9s ease-in-out infinite; }
        .ra-shimmer {
          background-size: 200% 100%;
          animation: ra-shimmer 2.2s linear infinite;
        }
      `}</style>

      {/* Floating glow blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl ra-float" />
      <div
        className="pointer-events-none absolute -right-20 top-64 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl ra-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/40 blur-3xl ra-float"
        style={{ animationDelay: "4s" }}
      />

      <Navbar />

      <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="ra-fade-up text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 shadow-sm ring-1 ring-indigo-100 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            AI powered
          </span>
          <h1 className="mt-4 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl md:text-5xl">
            AI Resume Analyzer
          </h1>
          {/* Flex wrapper centers the paragraph even if a global `p` rule overrides margins */}
          <div className="mt-3 flex justify-center">
            <p className="max-w-xl text-center text-slate-600">
              Upload your resume and see how well it matches the role you're
              targeting, with a clear score and a plan to improve it.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <section
          className="ra-fade-up mt-10 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur sm:p-8"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="grid gap-6 md:grid-cols-5">
            {/* Dropzone */}
            <div className="md:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Resume{" "}
                <span className="font-normal text-slate-400">
                  (PDF, max 5 MB)
                </span>
              </label>

              <div
                onClick={() => !file && inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex min-h-48 items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
                  dragging
                    ? "scale-[1.02] border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/20"
                    : file
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "cursor-pointer border-indigo-200 bg-linear-to-br from-indigo-50/60 to-violet-50/60 hover:border-indigo-400 hover:shadow-md"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />

                {file ? (
                  <div className="flex w-full max-w-sm items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-emerald-100 sm:gap-4 sm:p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-orange-400 text-xs font-bold text-white shadow-md shadow-rose-500/30">
                      PDF
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatSize(file.size)} · ready to analyze
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-300 ${
                        dragging ? "-translate-y-1 scale-110" : ""
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-7 w-7"
                      >
                        <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
                        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {dragging
                        ? "Drop your PDF here"
                        : "Drag your PDF here, or "}
                      {!dragging && (
                        <span className="font-semibold text-indigo-600">
                          browse files
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Target role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Your resume is scored against the skills this role usually
                requires.
              </p>

              <div className="mt-4 hidden rounded-xl bg-linear-to-br from-indigo-50 to-violet-50 p-4 text-xs leading-5 text-slate-600 ring-1 ring-indigo-100 md:block">
                <p className="font-semibold text-indigo-700">What you'll get</p>
                <ul className="mt-1 space-y-1">
                  <li>✦ A match score out of 100</li>
                  <li>✦ Skills you already have</li>
                  <li>✦ Skills worth learning next</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="ra-fade-up mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span className="mt-0.5 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="group relative mt-6 w-full overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {LOADING_STEPS[stepIndex]}
                </>
              ) : (
                <>Analyze resume</>
              )}
            </span>
          </button>

          {/* Loading shimmer bar */}
          {loading && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-indigo-100">
              <div className="ra-shimmer h-full w-full rounded-full bg-linear-to-r from-indigo-200 via-violet-500 to-indigo-200" />
            </div>
          )}
        </section>

        {/* Results */}
        {result && tone && (
          <div ref={resultRef} className="mt-10 space-y-6 scroll-mt-6">
            {/* Score */}
            <section className="ra-fade-up overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-indigo-500/10 backdrop-blur">
              <div className="h-1.5 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
              <div className="flex flex-col items-center gap-6 p-6 sm:gap-8 sm:p-8 md:flex-row md:items-center">
                <div
                  className={`relative shrink-0 rounded-full shadow-2xl ${tone.glow}`}
                >
                  <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90 sm:h-44 sm:w-44">
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="#eef2ff"
                      strokeWidth="10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_RADIUS}
                      fill="none"
                      stroke={tone.stroke}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                      {animatedPercent}%
                    </span>
                    <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                      Match
                    </span>
                  </div>
                </div>

                <div className="min-w-0 text-center md:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Target role
                  </p>
                  <h2 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                    {result.targetRole}
                  </h2>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
                  >
                    {tone.label}
                  </span>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {result.experienceSummary}
                  </p>
                </div>
              </div>
            </section>

            {/* Skills */}
            <div className="grid gap-6 md:grid-cols-2">
              <section
                className="ra-fade-up rounded-3xl border border-emerald-100 bg-linear-to-br from-white to-emerald-50/70 p-6 shadow-lg shadow-emerald-500/5"
                style={{ animationDelay: "0.15s" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm text-white shadow-md shadow-emerald-500/30">
                      ✓
                    </span>
                    Matched skills
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    {result.matchedSkills.length}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill, i) => (
                    <span
                      key={`${skill}-${i}`}
                      className="ra-fade-up cursor-default break-words rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-md"
                      style={{ animationDelay: `${0.2 + i * 0.03}s` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section
                className="ra-fade-up rounded-3xl border border-amber-100 bg-linear-to-br from-white to-amber-50/70 p-6 shadow-lg shadow-amber-500/5"
                style={{ animationDelay: "0.25s" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm text-white shadow-md shadow-amber-500/30">
                      ↑
                    </span>
                    Skills to improve
                  </h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    {result.missingSkills.length}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.missingSkills.map((skill, i) => (
                    <span
                      key={`${skill}-${i}`}
                      className="ra-fade-up cursor-default break-words rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-500 hover:text-white hover:shadow-md"
                      style={{ animationDelay: `${0.3 + i * 0.03}s` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Recommendations */}
            <section
              className="ra-fade-up rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-indigo-500/10 sm:p-8"
              style={{ animationDelay: "0.35s" }}
            >
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-sm text-white shadow-md shadow-indigo-500/30">
                  ✦
                </span>
                Recommended next steps
              </h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {result.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="ra-fade-up group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10"
                    style={{ animationDelay: `${0.4 + i * 0.07}s` }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-500/30 transition group-hover:scale-110">
                      {i + 1}
                    </div>
                    <p className="min-w-0 break-words text-sm leading-6 text-slate-600">{rec}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              {result.missingSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/interview", {
                      state: {
                        role: result.targetRole,
                        skills: result.missingSkills,
                      },
                    })
                  }
                  className="w-full rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Practice these skills
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-indigo-600 shadow-md ring-1 ring-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-lg sm:w-auto"
              >
                Analyze another resume
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeAnalyzer;