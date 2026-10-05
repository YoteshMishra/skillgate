import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import api, { API_ORIGIN } from "../api/axios";
import Navbar from "../components/Navbar";

interface Profile {
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string;
  education?: string;
  experience?: string;
  resumeUrl?: string;
  resumeName?: string;
}

function Profile() {
  const [profile, setProfile] = useState<Profile>({});
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data.profile);
      setCompleteness(response.data.completeness);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const { phone, location, summary, skills, education, experience } = profile;
      const response = await api.put("/profile/me", {
        phone,
        location,
        summary,
        skills,
        education,
        experience,
      });
      setProfile(response.data.profile);
      setCompleteness(response.data.completeness);
      setMessage("Profile updated.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setUploading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await api.post("/profile/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(response.data.profile);
      setCompleteness(response.data.completeness);
      setMessage("Resume uploaded.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload resume");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const inputClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
  const cardClass =
    "rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-8">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="mt-4 h-3 w-2/3 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const complete = completeness === 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              My profile
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Employers see this when you apply to a role.
            </p>
          </div>

          <div className="space-y-6">
            {/* Completeness */}
            <section className={cardClass}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Profile completeness
                </h3>
                <span
                  className={`text-sm font-semibold ${
                    complete ? "text-emerald-600" : "text-teal-700"
                  }`}
                >
                  {completeness}%
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={completeness}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completeness"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    complete ? "bg-emerald-500" : "bg-teal-600"
                  }`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {!complete && (
                <p className="mt-3 text-sm text-slate-500">
                  Complete your profile to stand out to recruiters.
                </p>
              )}
            </section>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
            )}

            {message && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {/* Resume */}
            <section className={cardClass}>
              <h3 className="text-base font-semibold text-slate-900">Resume</h3>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
                      <path d="M14 3v5h5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    {profile.resumeUrl ? (
                      <a
                        href={`${API_ORIGIN}${profile.resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline"
                      >
                        {profile.resumeName || "View resume"}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-700">
                        No resume uploaded yet
                      </p>
                    )}
                    <p className="text-xs text-slate-500">PDF, DOC or DOCX. Max 5MB.</p>
                  </div>
                </div>

                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 ${
                    uploading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {uploading
                    ? "Uploading..."
                    : profile.resumeUrl
                    ? "Replace resume"
                    : "Upload resume"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              </div>
            </section>

            {/* Details */}
            <section className={cardClass}>
              <h3 className="text-base font-semibold text-slate-900">
                Profile details
              </h3>

              <form onSubmit={handleSave} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="summary" className={labelClass}>
                    Profile summary
                  </label>
                  <textarea
                    id="summary"
                    rows={4}
                    value={profile.summary || ""}
                    onChange={(e) => handleChange("summary", e.target.value)}
                    placeholder="A short summary of your experience and goals"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label htmlFor="skills" className={labelClass}>
                    Skills
                  </label>
                  <input
                    id="skills"
                    type="text"
                    value={profile.skills || ""}
                    onChange={(e) => handleChange("skills", e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience" className={labelClass}>
                      Experience
                    </label>
                    <input
                      id="experience"
                      type="text"
                      value={profile.experience || ""}
                      onChange={(e) => handleChange("experience", e.target.value)}
                      placeholder="e.g. 2 years as a Frontend Developer"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="education" className={labelClass}>
                      Education
                    </label>
                    <input
                      id="education"
                      type="text"
                      value={profile.education || ""}
                      onChange={(e) => handleChange("education", e.target.value)}
                      placeholder="e.g. B.Tech in Computer Science"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={profile.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className={labelClass}>
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={profile.location || ""}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;