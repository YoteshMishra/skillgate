import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import GoogleButton, { OrDivider } from "../components/GoogleButton";

const ROLES = [
  { value: "JOB_SEEKER", label: "Job seeker", hint: "Browse roles and apply" },
  { value: "RECRUITER", label: "Recruiter", hint: "Post roles and review applicants" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{ credential: string; name: string } | null>(null);
  const [role, setRole] = useState("JOB_SEEKER");
  const navigate = useNavigate();
  const googleOn = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const finishLogin = (token: string, user: unknown) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/jobs");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      finishLogin(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // New Google users are asked to pick a role once, then this runs again with it
  const handleGoogle = async (credential: string, chosenRole?: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/google", { credential, role: chosenRole });
      if (res.data.needsRole) {
        setPending({ credential, name: res.data.name });
        return;
      }
      finishLogin(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Google sign-in failed");
      setPending(null);
    } finally {
      setLoading(false);
    }
  };
  console.log("Google client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const inputClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

  const errorBox = error && (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  );

  const spinner = (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );

  const primaryBtn =
    "flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        />

        <Link to="/" className="relative flex items-center gap-2.5">
          <LogoMark />
          <span className="text-xl font-semibold tracking-tight">SkillGate</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Hiring and job search, in one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Candidates apply to roles that match their skills. Employers post
            openings and review applicants without the back and forth.
          </p>

          <ul className="mt-10 space-y-5">
            <li className="flex gap-3.5">
              <CheckIcon />
              <div>
                <p className="font-medium">For candidates</p>
                <p className="text-sm text-slate-400">Browse open roles and apply in a few clicks.</p>
              </div>
            </li>
            <li className="flex gap-3.5">
              <CheckIcon />
              <div>
                <p className="font-medium">For employers</p>
                <p className="text-sm text-slate-400">
                  Post a role and manage every applicant from one dashboard.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-slate-500">&copy; {new Date().getFullYear()} SkillGate</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-12 lg:bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <LogoMark dark />
            <span className="text-xl font-semibold tracking-tight text-slate-900">SkillGate</span>
          </Link>

          {pending ? (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome, {pending.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                One last step. How will you use SkillGate?
              </p>

              <div className="mt-8 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer rounded-lg border px-3.5 py-3 text-left transition focus-within:ring-2 focus-within:ring-teal-600/30 ${
                        role === r.value
                          ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                          : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{r.hint}</span>
                    </label>
                  ))}
                </div>

                {errorBox}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleGoogle(pending.credential, role)}
                  className={primaryBtn}
                >
                  {loading && spinner}
                  {loading ? "Creating account..." : "Continue"}
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setError("");
                  }}
                  className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Back to log in
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Log in to your account
              </h2>
              <p className="mt-2 text-sm text-slate-600">Find your next role or your next hire.</p>

              {googleOn && (
                <div className="mt-8 space-y-5">
                  <GoogleButton mode="signin" onCredential={(c) => handleGoogle(c)} />
                  <OrDivider />
                </div>
              )}

              <form onSubmit={handleSubmit} className={`${googleOn ? "mt-5" : "mt-8"} space-y-5`}>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`${inputClass} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 focus:outline-none focus-visible:text-teal-700"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {errorBox}

                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading && spinner}
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-teal-700 hover:text-teal-800 hover:underline focus:outline-none focus-visible:underline"
                >
                  Register
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        dark ? "bg-slate-900 text-white" : "bg-teal-600 text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V10a8 8 0 0116 0v10" />
        <path d="M9 20v-6a3 3 0 016 0v6" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export default Login;