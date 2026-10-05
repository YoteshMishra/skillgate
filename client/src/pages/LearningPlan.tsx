import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { generateLearningPlan, getLearningPlan } from "../services/aiService";
import type {
  LearningPlan,
  PlanPriority,
  PlanSource,
} from "../services/aiService";

const cardClass =
  "rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur sm:p-8";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const PRIORITY_STYLE: Record<PlanPriority, { label: string; badge: string }> = {
  HIGH: { label: "High priority", badge: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  MEDIUM: { label: "Medium priority", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  LOW: { label: "Low priority", badge: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

const SOURCE_STYLE: Record<PlanSource, { label: string; badge: string }> = {
  RESUME: { label: "From your resume", badge: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  INTERVIEW: { label: "From interview practice", badge: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  BOTH: { label: "Resume + interview", badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20" },
};

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        dark ? "border-indigo-200 border-t-indigo-600" : "border-white/40 border-t-white"
      }`}
    />
  );
}

function LearningPlanPage() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Load the saved plan (if any)
  useEffect(() => {
    let active = true;
    getLearningPlan()
      .then((p) => {
        if (active) setPlan(p);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Restore checked steps for this plan from this browser
  const planId = plan?.id;
  useEffect(() => {
    if (planId === undefined) return;
    try {
      setDone(JSON.parse(localStorage.getItem(`learning-progress-${planId}`) || "{}"));
    } catch {
      setDone({});
    }
  }, [planId]);

  const toggleStep = (key: string) => {
    if (!plan) return;
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try {
      localStorage.setItem(`learning-progress-${plan.id}`, JSON.stringify(next));
    } catch {
      // storage unavailable: progress just won't persist
    }
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const p = await generateLearningPlan();
      setDone({});
      setPlan(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const allKeys = plan
    ? plan.priorities.flatMap((p, i) => p.steps.map((_, j) => `${i}-${j}`))
    : [];
  const doneCount = allKeys.filter((k) => done[k]).length;
  const percent = allKeys.length ? Math.round((doneCount / allKeys.length) * 100) : 0;

  const errorBox = error && (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      <span className="mt-0.5 font-bold">!</span>
      <span>{error}</span>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-indigo-50/60 to-violet-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-64 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl" />

      <Navbar />

      <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 shadow-sm ring-1 ring-indigo-100 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            AI powered
          </span>
          <h1 className="mt-4 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Learning Plan
          </h1>
          <div className="mt-3 flex justify-center">
            <p className="max-w-xl text-center text-slate-600">
              A study plan built from the skills your resume is missing and the
              weak spots from your practice interviews.
            </p>
          </div>
        </div>

        <div className="mt-10">
          {/* Loading */}
          {loading && (
            <div className={`${cardClass} animate-pulse`} aria-busy="true">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded bg-slate-100" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !plan && (
            <section className={`${cardClass} text-center`}>
              {errorBox}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 text-2xl text-white shadow-lg shadow-indigo-500/30">
                ✦
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                You don't have a plan yet
              </h2>
              <div className="mt-2 flex justify-center">
                <p className="max-w-md text-center text-sm leading-6 text-slate-600">
                  Run the Resume Analyzer or practice an interview first, then
                  generate your plan. Doing both gives the best results.
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/resume-analyzer" className={secondaryBtn}>
                  Analyze my resume
                </Link>
                <Link to="/interview" className={secondaryBtn}>
                  Practice interview
                </Link>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className={`${primaryBtn} mt-6`}
              >
                {generating ? (
                  <>
                    <Spinner />
                    Building your plan...
                  </>
                ) : (
                  "Generate my plan"
                )}
              </button>
              {generating && (
                <p className="mt-3 text-xs text-slate-500">
                  This can take up to 30 seconds.
                </p>
              )}
            </section>
          )}

          {/* Plan */}
          {!loading && plan && (
            <div className="space-y-6">
              {errorBox}

              <section className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Target role
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {plan.targetRole}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Generated on{" "}
                      {new Date(plan.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className={secondaryBtn}
                  >
                    {generating ? (
                      <>
                        <Spinner dark />
                        Building...
                      </>
                    ) : (
                      "Regenerate plan"
                    )}
                  </button>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{plan.summary}</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">Your progress</span>
                    <span className="font-semibold text-indigo-600">
                      {doneCount} of {allKeys.length} steps
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Learning plan progress"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent === 100 ? "bg-emerald-500" : "bg-linear-to-r from-indigo-500 to-violet-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Regenerating creates a new plan and resets your checked steps.
                  </p>
                </div>
              </section>

              {plan.priorities.map((p, i) => (
                <section key={i} className={cardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${PRIORITY_STYLE[p.priority].badge}`}
                    >
                      {PRIORITY_STYLE[p.priority].label}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${SOURCE_STYLE[p.source].badge}`}
                    >
                      {SOURCE_STYLE[p.source].label}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-slate-900">{p.topic}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{p.reason}</p>

                  <ul className="mt-4 space-y-1">
                    {p.steps.map((step, j) => {
                      const key = `${i}-${j}`;
                      const checked = Boolean(done[key]);
                      return (
                        <li key={key}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStep(key)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600"
                            />
                            <span
                              className={`text-sm leading-6 ${
                                checked ? "text-slate-400 line-through" : "text-slate-700"
                              }`}
                            >
                              {step}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/interview", {
                          state: {
                            role: plan.targetRole,
                            skills: [p.topic.slice(0, 60)],
                          },
                        })
                      }
                      className={secondaryBtn}
                    >
                      Practice this topic
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default LearningPlanPage;