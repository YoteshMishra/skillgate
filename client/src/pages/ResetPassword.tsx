import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>
        {!token ? (
          <p className="mt-3 text-sm text-red-600">This reset link is missing its token.</p>
        ) : done ? (
          <p className="mt-3 text-sm text-teal-700">Password updated. Redirecting to login...</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <input type="password" placeholder="New password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={input} />
            <input type="password" placeholder="Confirm new password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} className={input} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading}
              className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
              {loading ? "Saving..." : "Update password"}
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