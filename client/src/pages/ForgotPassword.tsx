import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios"; // your existing axios instance

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Forgot your password?</h1>
        {sent ? (
          <p className="mt-3 text-sm text-slate-600">
            If an account exists for <b>{email}</b>, we've sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading}
              className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 block text-center text-sm text-teal-700 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}