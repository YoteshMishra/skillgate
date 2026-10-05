import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const links: { to: string; label: string }[] = [{ to: "/jobs", label: "Jobs" }];

  if (user?.role === "RECRUITER") {
    links.push(
      { to: "/post-job", label: "Post a Job" },
      { to: "/my-jobs", label: "My Postings" },
      { to: "/candidates", label: "Find Candidates" }
    );
  }
  if (user?.role === "JOB_SEEKER") {
    links.push(
      { to: "/dashboard", label: "My Applications" },
      { to: "/profile", label: "My Profile" },
      { to: "/interview", label: "Interview" },
      { to: "/learning", label: "Learning" }
    );
  }

  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-white/10 text-white"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  const mobileLink = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2.5 text-base font-medium transition ${
      isActive
        ? "bg-white/10 text-white"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#123a66] shadow-sm">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/jobs" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 20V10a8 8 0 0116 0v10" />
              <path d="M9 20v-6a3 3 0 016 0v6" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            SkillGate
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={desktopLink}>
              {l.label}
            </NavLink>
          ))}

          <span className="mx-3 h-6 w-px bg-white/15" aria-hidden="true" />

          {user && (
            <div className="mr-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                {initial}
              </span>
              <span className="max-w-35 truncate text-sm font-medium text-white">
                {user.name}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/25 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-[#0f3157] px-4 pb-5 pt-3 lg:hidden"
        >
          <div className="space-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={mobileLink}>
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            {user && (
              <div className="mb-3 flex items-center gap-3 px-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-slate-400">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-white/25 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;