import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Google sign-in"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function GoogleButton({
  mode,
  onCredential,
}: {
  mode: "signin" | "signup";
  onCredential: (credential: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const handler = useRef(onCredential);

  // Always call the latest callback without re-initialising Google
  useEffect(() => {
    handler.current = onCredential;
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res: { credential: string }) => handler.current(res.credential),
        });
        window.google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(400, Math.max(200, box.current.offsetWidth || 384)),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (!CLIENT_ID) return null;
  return <div ref={box} className="flex min-h-[44px] w-full justify-center" />;
}

export function OrDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-slate-50 px-3 text-xs text-slate-500 lg:bg-white">or with email</span>
      </div>
    </div>
  );
}