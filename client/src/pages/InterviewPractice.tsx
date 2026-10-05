import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  evaluateAnswer,
  generateQuestion,
  getInterviewSummary,
} from "../services/aiService";
import type {
  AnswerEvaluation,
  Difficulty,
  InterviewSummary,
} from "../services/aiService";

const ROLES = [
  "Frontend Developer",
  "React.js Developer",
  "Full Stack Developer",
  "JavaScript Developer",
  "Software Developer",
];

const DEFAULT_SKILLS = [
  "React Hooks",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "CSS & Tailwind",
  "REST APIs",
];

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: "EASY", label: "Easy", hint: "Fundamentals" },
  { value: "MEDIUM", label: "Medium", hint: "Everyday work" },
  { value: "HARD", label: "Hard", hint: "Deep dives" },
];

const MAX_ANSWER = 3000;

type Step = "setup" | "practice" | "result" | "summary";
type Busy = "" | "question" | "evaluate" | "summary";

const cardClass =
  "rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur sm:p-8";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15";

function tone(score: number) {
  if (score >= 75) {
    return {
      label: "Strong answer",
      stroke: "stroke-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    };
  }
  if (score >= 50) {
    return {
      label: "Partial answer",
      stroke: "stroke-amber-500",
      badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    };
  }
  return {
    label: "Needs work",
    stroke: "stroke-rose-500",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        dark ? "border-indigo-200 border-t-indigo-600" : "border-white/40 border-t-white"
      }`}
    />
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  // Start at 0 and animate to the real value
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const t = tone(value);

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          className={`${t.stroke} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums text-slate-900">{value}</span>
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Score
        </span>
      </div>
    </div>
  );
}

function InterviewPractice() {
  const location = useLocation();
  const prefill = location.state as { role?: string; skills?: string[] } | null;

  const roleOptions =
    prefill?.role && !ROLES.includes(prefill.role)
      ? [prefill.role, ...ROLES]
      : ROLES;
  const fromResume = Boolean(prefill?.skills?.length);
  const suggestions = fromResume ? (prefill?.skills ?? []).slice(0, 8) : DEFAULT_SKILLS;

  // Setup
  const [role, setRole] = useState(prefill?.role ?? "Frontend Developer");
  const [skill, setSkill] = useState(prefill?.skills?.[0] ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");

  // Session
  const [step, setStep] = useState<Step>("setup");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showBetter, setShowBetter] = useState(false);
  const [attemptIds, setAttemptIds] = useState<number[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);

  const [busy, setBusy] = useState<Busy>("");
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const questionNumber = step === "result" ? attemptIds.length : attemptIds.length + 1;

  const fetchQuestion = async (previous: string[]) => {
    setError("");
    setBusy("question");
    try {
      const q = await generateQuestion({
        role,
        skill: skill.trim(),
        difficulty,
        previousQuestions: previous,
      });
      setQuestion(q);
      setAskedQuestions([...previous, q]);
      setAnswer("");
      setEvaluation(null);
      setShowBetter(false);
      setStep("practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const startSession = () => {
    if (skill.trim().length < 2) {
      setError("Enter a skill to practice, for example React Hooks.");
      return;
    }
    setAttemptIds([]);
    setAskedQuestions([]);
    setSummary(null);
    fetchQuestion([]);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || busy) return;
    setError("");
    setBusy("evaluate");
    try {
      const { attemptId, evaluation: result } = await evaluateAnswer({
        role,
        skill: skill.trim(),
        difficulty,
        question,
        answer: answer.trim(),
      });
      setEvaluation(result);
      setAttemptIds((ids) => [...ids, attemptId]);
      setShowBetter(false);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const resetSession = () => {
    setStep("setup");
    setQuestion("");
    setAnswer("");
    setEvaluation(null);
    setAttemptIds([]);
    setAskedQuestions([]);
    setSummary(null);
    setError("");
  };

  const finishSession = async () => {
    if (attemptIds.length === 0) {
      resetSession();
      return;
    }
    setError("");
    setBusy("summary");
    try {
      const s = await getInterviewSummary(attemptIds);
      setSummary(s);
      setStep("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const onAnswerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitAnswer();
  };

  const difficultyLabel = DIFFICULTIES.find((d) => d.value === difficulty)?.label ?? "";

  const sessionBar = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 ring-1 ring-inset ring-indigo-200">
          {role}
        </span>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700 ring-1 ring-inset ring-violet-200">
          {skill.trim()}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">
          {difficultyLabel}
        </span>
      </div>
      <span className="text-sm font-semibold text-slate-600">
        Question {questionNumber}
      </span>
    </div>
  );

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

      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* ---------------- SETUP ---------------- */}
        {step === "setup" && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 shadow-sm ring-1 ring-indigo-100 backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                AI powered
              </span>
              <h1 className="mt-4 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                Interview Practice
              </h1>
              <div className="mt-3 flex justify-center">
                <p className="max-w-xl text-center text-slate-600">
                  Answer realistic interview questions and get a score, honest
                  feedback and a model answer for each one.
                </p>
              </div>
            </div>

            <section className={`${cardClass} mt-10`}>
              {errorBox}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
                    Target role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={fieldClass}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="skill" className="mb-2 block text-sm font-semibold text-slate-700">
                    Skill to practice
                  </label>
                  <input
                    id="skill"
                    type="text"
                    maxLength={60}
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    placeholder="e.g. React Hooks"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {fromResume
                    ? "Skills from your resume analysis"
                    : "Quick picks"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkill(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition ${
                        skill === s
                          ? "bg-indigo-600 text-white ring-indigo-600"
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-slate-700">Difficulty</p>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      aria-pressed={difficulty === d.value}
                      className={`rounded-xl border px-3 py-3 text-center transition ${
                        difficulty === d.value
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-800">
                        {d.label}
                      </span>
                      <span className="block text-xs text-slate-500">{d.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={startSession}
                disabled={busy !== ""}
                className={`${primaryBtn} mt-8 w-full`}
              >
                {busy === "question" ? (
                  <>
                    <Spinner />
                    Generating your first question...
                  </>
                ) : (
                  "Start practice"
                )}
              </button>
              {busy === "question" && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  This can take up to 20 seconds.
                </p>
              )}
            </section>
          </>
        )}

        {/* ---------------- PRACTICE ---------------- */}
        {step === "practice" && (
          <>
            {sessionBar}
            <section className={cardClass}>
              {errorBox}

              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Interview question
              </p>
              <div className="mt-3 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 p-5 ring-1 ring-indigo-100">
                <p className="text-lg font-semibold leading-7 text-slate-900">
                  {question}
                </p>
              </div>

              <label htmlFor="answer" className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
                Your answer
              </label>
              <textarea
                id="answer"
                rows={8}
                maxLength={MAX_ANSWER}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={onAnswerKeyDown}
                disabled={busy === "evaluate"}
                placeholder="Type your answer as you would say it in an interview..."
                className={`${fieldClass} resize-y leading-6 font-normal`}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Ctrl + Enter to submit</span>
                <span className={answer.length > MAX_ANSWER - 200 ? "text-amber-600" : ""}>
                  {answer.length}/{MAX_ANSWER}
                </span>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fetchQuestion(askedQuestions)}
                    disabled={busy !== ""}
                    className={secondaryBtn}
                  >
                    {busy === "question" ? <Spinner dark /> : null}
                    Skip question
                  </button>
                  {attemptIds.length > 0 && (
                    <button
                      type="button"
                      onClick={finishSession}
                      disabled={busy !== ""}
                      className={secondaryBtn}
                    >
                      {busy === "summary" ? <Spinner dark /> : null}
                      Finish session
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || busy !== ""}
                  className={primaryBtn}
                >
                  {busy === "evaluate" ? (
                    <>
                      <Spinner />
                      Evaluating...
                    </>
                  ) : (
                    "Submit answer"
                  )}
                </button>
              </div>
              {busy === "evaluate" && (
                <p className="mt-3 text-right text-xs text-slate-500">
                  Reading your answer. This can take up to 20 seconds.
                </p>
              )}
            </section>
          </>
        )}

        {/* ---------------- RESULT ---------------- */}
        {step === "result" && evaluation && (
          <>
            {sessionBar}
            {errorBox}
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <ScoreRing value={evaluation.score} />
                  <div className="text-center sm:text-left">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone(evaluation.score).badge}`}
                    >
                      {tone(evaluation.score).label}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{question}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {evaluation.feedback}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-3xl border border-emerald-100 bg-linear-to-br from-white to-emerald-50/70 p-6 shadow-lg shadow-emerald-500/5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm text-white shadow-md shadow-emerald-500/30">
                      ✓
                    </span>
                    What you did well
                  </h2>
                  {evaluation.strengths.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">Nothing stood out this time.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="rounded-lg bg-white px-3 py-2 text-sm text-emerald-800 shadow-sm ring-1 ring-emerald-200">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-3xl border border-amber-100 bg-linear-to-br from-white to-amber-50/70 p-6 shadow-lg shadow-amber-500/5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm text-white shadow-md shadow-amber-500/30">
                      ↑
                    </span>
                    What to improve
                  </h2>
                  {evaluation.weaknesses.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No gaps found. Nice work.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {evaluation.weaknesses.map((w, i) => (
                        <li key={i} className="rounded-lg bg-white px-3 py-2 text-sm text-amber-800 shadow-sm ring-1 ring-amber-200">
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <section className={cardClass}>
                <button
                  type="button"
                  onClick={() => setShowBetter((s) => !s)}
                  aria-expanded={showBetter}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-sm text-white shadow-md shadow-indigo-500/30">
                      ✦
                    </span>
                    {showBetter ? "Hide model answer" : "Show model answer"}
                  </span>
                  <span className={`text-slate-400 transition-transform ${showBetter ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {showBetter && (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 ring-1 ring-slate-100">
                    {evaluation.betterAnswer}
                  </p>
                )}
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => fetchQuestion(askedQuestions)}
                  disabled={busy !== ""}
                  className={primaryBtn}
                >
                  {busy === "question" ? (
                    <>
                      <Spinner />
                      Generating...
                    </>
                  ) : (
                    "Next question"
                  )}
                </button>
                <button
                  type="button"
                  onClick={finishSession}
                  disabled={busy !== ""}
                  className={secondaryBtn}
                >
                  {busy === "summary" ? <Spinner dark /> : null}
                  Finish session
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---------------- SUMMARY ---------------- */}
        {step === "summary" && summary && (
          <div className="space-y-6">
            <section className={cardClass}>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <ScoreRing value={summary.averageScore} />
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Session complete
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Average score: {summary.averageScore}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    You answered {summary.attemptCount} question
                    {summary.attemptCount === 1 ? "" : "s"} on{" "}
                    <span className="font-semibold text-slate-800">{skill.trim()}</span> for{" "}
                    {role}.
                  </p>
                </div>
              </div>
            </section>

            {summary.weakTopics.length > 0 && (
              <section className="rounded-3xl border border-amber-100 bg-linear-to-br from-white to-amber-50/70 p-6 shadow-lg shadow-amber-500/5">
                <h2 className="text-lg font-bold text-slate-900">Weak spots</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.weakTopics.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {summary.recommendations.length > 0 && (
              <section className={cardClass}>
                <h2 className="text-lg font-bold text-slate-900">What to study next</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {summary.recommendations.map((r, i) => (
                    <div
                      key={i}
                      className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-500/30">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{r.topic}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={resetSession} className={primaryBtn}>
                Start a new session
              </button>
              <Link to="/dashboard" className={secondaryBtn}>
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InterviewPractice;