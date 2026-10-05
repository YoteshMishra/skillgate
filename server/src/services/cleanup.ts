import cron from "node-cron";
import prisma from "../prismaClient";

// ---- How long to keep things (change these numbers) ----
const KEEP_INTERVIEW_ATTEMPTS_DAYS = 90;
const KEEP_RESUME_ANALYSES_DAYS = 90; // each user's newest one is always kept
const KEEP_LEARNING_PLANS_DAYS = 90; // each user's newest one is always kept

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

export async function runCleanup() {
  console.log("[cleanup] started");

  // 1. Password reset tokens that have expired
  const tokens = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // 2. Old interview attempts
  const attempts = await prisma.interviewAttempt.deleteMany({
    where: { createdAt: { lt: daysAgo(KEEP_INTERVIEW_ATTEMPTS_DAYS) } },
  });

  // 3. Old resume analyses, but keep each user's latest
  //    (the Learning Plan reads the latest one)
  const latestAnalyses = await prisma.resumeAnalysis.groupBy({
    by: ["userId"],
    _max: { id: true },
  });
  const keepAnalysisIds = latestAnalyses
    .map((g) => g._max.id)
    .filter((id): id is number => id !== null);
  const analyses = await prisma.resumeAnalysis.deleteMany({
    where: {
      createdAt: { lt: daysAgo(KEEP_RESUME_ANALYSES_DAYS) },
      id: { notIn: keepAnalysisIds },
    },
  });

  // 4. Old learning plans, but keep each user's latest
  const latestPlans = await prisma.learningPlan.groupBy({
    by: ["userId"],
    _max: { id: true },
  });
  const keepPlanIds = latestPlans
    .map((g) => g._max.id)
    .filter((id): id is number => id !== null);
  const plans = await prisma.learningPlan.deleteMany({
    where: {
      createdAt: { lt: daysAgo(KEEP_LEARNING_PLANS_DAYS) },
      id: { notIn: keepPlanIds },
    },
  });

  console.log(
    `[cleanup] done. Removed: ${tokens.count} reset tokens, ${attempts.count} interview attempts, ` +
      `${analyses.count} resume analyses, ${plans.count} learning plans`
  );
}

// Runs every Sunday at 3:00 AM server time
export function startCleanupJob() {
  cron.schedule("0 3 * * 0", () => {
    runCleanup().catch((err) => console.error("[cleanup] FAILED:", err));
  });
  console.log("[cleanup] weekly job scheduled (Sundays 3:00 AM)");
}

// Lets you run it by hand: npx ts-node src/services/cleanup.ts
if (require.main === module) {
  runCleanup()
    .catch((err) => console.error("[cleanup] FAILED:", err))
    .finally(() => prisma.$disconnect());
}