import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const ICONS: Record<string, string> = {
  resume: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  interview: "M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4",
  learning: "M3 7l9-4 9 4-9 4zM7 9v6c0 1.5 2.2 3 5 3s5-1.5 5-3V9",
  check: "M5 12l5 5 9-10",
};

const SHOWCASE = [
  { key: "resume", title: "Resume Analyzer", cta: "Try it free", glow: "from-teal-500 to-cyan-400",
    text: "Upload your PDF, pick a target role and see your match score, missing skills and what to fix." },
  { key: "interview", title: "Interview Practice AI", cta: "Log in to practice", glow: "from-sky-500 to-blue-600",
    text: "Answer realistic questions and get a score, your strengths, weak points and a model answer." },
  { key: "learning", title: "Learning Plan", cta: "Log in to get yours", glow: "from-emerald-400 to-teal-500",
    text: "Your resume gaps and interview weak spots become a prioritised study plan with clear steps." },
];

const STEPS = [
  ["Analyze your resume", "Upload a PDF and choose a role. You get a match score and a list of missing skills."],
  ["Practice the interview", "Answer role-specific questions and get scored feedback with a model answer."],
  ["Follow your plan", "Gaps from both steps turn into a prioritised study plan you can work through."],
];

const SEEKER = [
  "Filter jobs by role, location and company, then apply in one click",
  "See every application as Pending, Reviewed, Accepted or Rejected",
  "Build a profile with a completeness score and upload your resume",
  "Keep interview attempts and your learning plan saved to your account",
];
const RECRUITER = [
  "Publish openings and manage all your postings in one place",
  "Update applicant status as you review each application",
  "Search candidate profiles and find the right fit faster",
];

const FAQ = [
  ["Is the resume analyzer free?", "Yes. You can run it without an account. To keep it fair for everyone, each visitor can run up to 3 analyses per hour."],
  ["Do you store my resume?", "The free analyzer on this page does not save your resume or its results to our database. The text is sent to an AI model to produce the analysis."],
  ["Which files can I upload?", "PDF resumes up to 5 MB. PDFs with selectable text work best, since scanned images cannot be read."],
  ["Do I need an account for interview practice and the learning plan?", "Yes. Both are available to logged-in job seekers, so your attempts and your plan stay saved to your account."],
  ["Can recruiters use SkillGate?", "Yes. Recruiters can sign up to post jobs, manage their openings, review applicants and update each applicant's status."],
];

const toList = (x: unknown): string[] =>
  Array.isArray(x)
    ? x.map((i: any) => (typeof i === "string" ? i : i?.title ?? i?.skill ?? i?.text ?? "")).filter(Boolean)
    : [];

const glass = "border border-white/10 bg-white/5 backdrop-blur-sm";
const chipOk = "rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30";
const chipMiss = "rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-400/30";

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20V10a8 8 0 0116 0v10" />
          <path d="M9 20v-6a3 3 0 016 0v6" />
        </svg>
      </span>
      SkillGate
    </span>
  );
}

function Ring({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">{pct}%</span>
        <span className="text-xs text-slate-400">match</span>
      </div>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-full bg-linear-to-tr from-teal-500/15 via-cyan-500/10 to-sky-500/15 blur-3xl" aria-hidden="true" />
      <div className="relative rounded-2xl border border-white/10 bg-[#0f1b2e]/80 p-6 shadow-2xl shadow-teal-500/10 backdrop-blur">
        <div className="flex items-center gap-5">
          <Ring pct={82} />
          <div>
            <p className="text-sm text-slate-400">Resume match for</p>
            <p className="text-lg font-semibold text-white">Frontend Developer</p>
            <p className="mt-1 text-xs text-slate-500">Sample result</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">Skills you have</p>
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Tailwind", "Git"].map((s) => <span key={s} className={chipOk}>{s}</span>)}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">Skills to add</p>
            <div className="flex flex-wrap gap-1.5">
              {["Testing", "Next.js", "Accessibility"].map((s) => <span key={s} className={chipMiss}>{s}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeTry() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Choose a PDF resume first.");
    if (!role.trim()) return setError("Enter the role you are targeting.");
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("targetRole", role.trim());
      const res = await api.post("/ai/analyze-resume-public", fd);
      setResult(res.data.analysis ?? res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not analyze the resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.round(Math.max(0, Math.min(100, Number(result?.matchPercentage ?? result?.matchScore ?? 0))));
  const field = "mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20";

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f1b2e]/70 p-6 shadow-2xl shadow-teal-500/10 backdrop-blur sm:p-10">
      <form onSubmit={run} className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className="text-sm font-semibold text-slate-200">Resume (PDF, max 5 MB)</span>
          <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:bg-white/10 focus-within:border-cyan-400">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20"><Icon name="resume" className="h-5 w-5" /></span>
            <span className="truncate">{file ? file.name : "Choose a PDF file"}</span>
            <input type="file" accept=".pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-200">
          Target role
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className={field} />
        </label>
        <div className="sm:col-span-2">
          <button disabled={loading}
            className="w-full rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40 disabled:opacity-70 sm:w-auto">
            {loading ? "Analyzing... this can take up to 30 seconds" : "Analyze my resume"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {result && (
        <div className="mt-8 space-y-6 border-t border-white/10 pt-8">
          <div className="flex items-center gap-5">
            <Ring pct={pct} size={104} />
            <div>
              <h3 className="text-lg font-semibold text-white">Match for {role}</h3>
              <p className="text-sm text-slate-400">Based on the skills found in your resume</p>
            </div>
          </div>
          {toList(result.matchedSkills).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-200">Skills you have</p>
              <div className="flex flex-wrap gap-2">{toList(result.matchedSkills).map((s) => <span key={s} className={chipOk}>{s}</span>)}</div>
            </div>
          )}
          {toList(result.missingSkills).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-200">Skills to add</p>
              <div className="flex flex-wrap gap-2">{toList(result.missingSkills).map((s) => <span key={s} className={chipMiss}>{s}</span>)}</div>
            </div>
          )}
          {toList(result.recommendations).length > 0 && (
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              {toList(result.recommendations).slice(0, 3).map((r) => (
                <li key={r} className="flex gap-2.5"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-cyan-400" />{r}</li>
              ))}
            </ul>
          )}
          <div className="rounded-2xl border border-teal-400/30 bg-linear-to-r from-teal-500/15 to-sky-500/15 p-5 text-sm text-teal-50">
            Want to practice interviews for these skills and get a study plan?{" "}
            <Link to="/register" className="font-semibold text-white underline underline-offset-2">Create a free account</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const loggedIn = Boolean(localStorage.getItem("token"));
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const open = (key: string) => {
    setMenu(false);
    setMobile(false);
    if (key === "resume") {
      if (loggedIn) navigate("/resume-analyzer");
      else scrollToId("resume-analyzer");
      return;
    }
    const path = key === "interview" ? "/interview" : "/learning";
    if (loggedIn) navigate(path);
    else setGate(key === "interview" ? "Interview Practice AI" : "Learning Plan");
  };

  const focus = "focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40";
  const itemClass = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white ${focus}`;
  const btnGhost = `rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${focus}`;
  const btnSolid = `rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 ${focus}`;
  const btnOutline = `rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${focus}`;
  const h2 = "text-3xl font-bold tracking-tight text-white sm:text-4xl";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-linear-to-b from-[#0b1324] via-[#0c192c] to-[#0e2438] text-slate-200 antialiased">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(50rem_28rem_at_20%_0%,rgba(20,184,166,0.10),transparent),radial-gradient(40rem_26rem_at_85%_10%,rgba(56,189,248,0.08),transparent),radial-gradient(36rem_20rem_at_55%_40%,rgba(16,185,129,0.05),transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1324]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" aria-label="SkillGate home"><Logo /></Link>
            <div className="relative hidden md:block" ref={dropRef}>
              <button onClick={() => setMenu((o) => !o)} aria-expanded={menu} className={btnGhost}>
                Features <span aria-hidden="true" className={`inline-block text-xs transition ${menu ? "rotate-180" : ""}`}>▾</span>
              </button>
              {menu && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0f1b2e] p-2 shadow-2xl shadow-black/50">
                  {SHOWCASE.map((f) => (
                    <button key={f.key} onClick={() => open(f.key)} className={itemClass}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20`}><Icon name={f.key} className="h-4 w-4" /></span>
                      {f.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => scrollToId("how-it-works")} className={`${btnGhost} hidden md:block`}>How it works</button>
            <button onClick={() => scrollToId("faq")} className={`${btnGhost} hidden md:block`}>FAQ</button>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {loggedIn ? (
              <Link to="/jobs" className={btnSolid}>Open app</Link>
            ) : (
              <>
                <Link to="/login" className={btnGhost}>Log in</Link>
                <Link to="/register" className={btnSolid}>Sign up</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobile((o) => !o)} aria-expanded={mobile} className={`${btnGhost} md:hidden`}>
            {mobile ? "Close" : "Menu"}
          </button>
        </div>

        {mobile && (
          <div className="space-y-1 border-t border-white/10 bg-[#0b1324] px-4 py-3 md:hidden">
            <p className="px-3 pb-1 text-sm font-semibold text-slate-500">Features</p>
            {SHOWCASE.map((f) => (
              <button key={f.key} onClick={() => open(f.key)} className={itemClass}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20`}><Icon name={f.key} className="h-4 w-4" /></span>
                {f.title}
              </button>
            ))}
            <div className="flex gap-2 pt-3">
              {loggedIn ? (
                <Link to="/jobs" className={`${btnSolid} flex-1 text-center`}>Open app</Link>
              ) : (
                <>
                  <Link to="/login" className={`${btnGhost} flex-1 border border-white/20 text-center`}>Log in</Link>
                  <Link to="/register" className={`${btnSolid} flex-1 text-center`}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative">
        {/* Hero */}
        <section>
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-cyan-200 ${glass}`}>
                <span className="h-2 w-2 rounded-full bg-teal-400" aria-hidden="true" />
                Free resume analysis, no sign-up needed
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                Find the job. Fix the gaps. Get hired.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                SkillGate connects job seekers and recruiters, and helps candidates get ready with AI resume analysis,
                interview practice and a personalised learning plan.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to={loggedIn ? "/jobs" : "/register"} className={`${btnSolid} px-7 py-3 text-center`}>
                  {loggedIn ? "Open app" : "Get started free"}
                </Link>
                <button onClick={() => open("resume")} className={btnOutline}>Try the resume analyzer</button>
              </div>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={h2}>Built to get you job-ready</h2>
            <p className="mt-4 text-lg text-slate-400">Three AI tools that take you from a first draft of your resume to interview day.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SHOWCASE.map((f) => (
              <article key={f.key} className={`group relative flex flex-col rounded-2xl p-7 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08] ${glass}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20`}>
                  <Icon name={f.key} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-white">{f.title}</h3>
                <p className="mt-2 flex-1 leading-7 text-slate-400">{f.text}</p>
                <button onClick={() => open(f.key)} className={`mt-6 self-start rounded-lg text-sm font-semibold text-cyan-300 hover:text-cyan-200 ${focus}`}>
                  {loggedIn ? "Open" : f.cta} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 border-y border-white/5 bg-white/[0.02] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className={`${h2} text-center`}>How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-400">Three steps from your first resume upload to a clear study plan.</p>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map(([title, text], i) => (
                <li key={title} className={`rounded-2xl p-7 ${glass}`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-base font-bold text-white">{i + 1}</span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-400">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Resume analyzer */}
        <section id="resume-analyzer" className="relative scroll-mt-16 py-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[40rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-600/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className={`${h2} text-center`}>Try the Resume Analyzer</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-400">No account needed. Upload a PDF and see how well it matches the role you want.</p>
            <div className="mt-10"><ResumeTry /></div>
          </div>
        </section>

        {/* Inside after login */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className={`${h2} text-center`}>What you get after you sign up</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-400">One account, with the right tools for job seekers and for recruiters.</p>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {[
                { title: "For job seekers", items: SEEKER, tone: "from-teal-500/35 to-cyan-500/15" },
                { title: "For recruiters", items: RECRUITER, tone: "from-sky-500/35 to-blue-500/15" },
              ].map((p) => (
                <article key={p.title} className={`overflow-hidden rounded-2xl ${glass}`}>
                  <div className={`bg-linear-to-r ${p.tone} px-7 py-5`}>
                    <h3 className="text-xl font-semibold text-white">{p.title}</h3>
                  </div>
                  <ul className="space-y-4 p-7">
                    {p.items.map((t) => (
                      <li key={t} className="flex gap-3 leading-7 text-slate-300">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Icon name="check" className="h-3.5 w-3.5" /></span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-20 sm:px-6">
          <h2 className={`${h2} text-center`}>Frequently asked questions</h2>
          <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden="true" className="text-xl leading-none text-teal-300 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-teal-600/25 to-sky-700/20 px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-96 max-w-full -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to get started?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-teal-50/80">Create a free account as a job seeker or a recruiter.</p>
            <Link to={loggedIn ? "/jobs" : "/register"} className={`relative mt-8 inline-block rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 ${focus}`}>
              {loggedIn ? "Open app" : "Sign up free"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/10 bg-[#0b1324]/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">An AI-powered job portal that connects job seekers and recruiters, and helps candidates get job-ready.</p>
          </div>
          <nav aria-label="Product">
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><button onClick={() => scrollToId("features")} className="hover:text-white">Features</button></li>
              <li><button onClick={() => open("resume")} className="hover:text-white">Resume Analyzer</button></li>
              <li><button onClick={() => scrollToId("how-it-works")} className="hover:text-white">How it works</button></li>
              <li><button onClick={() => scrollToId("faq")} className="hover:text-white">FAQ</button></li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <p className="text-sm font-semibold text-white">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link to="/login" className="hover:text-white">Log in</Link></li>
              <li><Link to="/register" className="hover:text-white">Sign up</Link></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10 py-6 text-center text-sm text-slate-500">&copy; {new Date().getFullYear()} SkillGate. All rights reserved.</div>
      </footer>

      {/* Login required modal */}
      {gate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setGate(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1b2e] p-7 shadow-2xl shadow-teal-500/20" onClick={(e) => e.stopPropagation()}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20"><Icon name={gate.startsWith("Interview") ? "interview" : "learning"} className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-semibold text-white">Log in to use {gate}</h3>
            <p className="mt-2 leading-7 text-slate-400">Create a free account or log in to practice interviews and get your personalised learning plan.</p>
            <div className="mt-6 flex gap-2">
              <Link to="/login" className={`${btnGhost} flex-1 border border-white/20 text-center`}>Log in</Link>
              <Link to="/register" className={`${btnSolid} flex-1 text-center`}>Sign up</Link>
            </div>
            <button onClick={() => setGate(null)} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-300">Not now</button>
          </div>
        </div>
      )}
    </div>
  );
}