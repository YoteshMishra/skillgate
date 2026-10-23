import { analyzeResume as analyzeResumeLive } from "./huggingface";
import { runWithFallback } from "./aiGuard";
import { fallbackResumeAnalysis } from "./fallbackData";

// Same name and signature as the original, so routes only change one import line.
export function analyzeResume(resumeText: string, targetRole: string) {
  return runWithFallback(
    "analyzeResume",
    () => analyzeResumeLive(resumeText, targetRole),
    () => fallbackResumeAnalysis(resumeText, targetRole)
  );
}