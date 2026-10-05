import express from "express";
import rateLimit from "express-rate-limit";
import prisma from "../prismaClient";
import { requireAuth } from "../middleware/auth";
import { generateLearningPlan } from "../services/learningAI";
import type {
  InterviewSkillStat,
  LearningPlanContent,
} from "../types/learning";

const router = express.Router();

router.use(requireAuth);

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

/* ---------- GET /api/learning/plan : latest saved plan (or null) ---------- */

router.get("/plan", async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const latest = await prisma.learningPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) return res.json({ success: true, plan: null });

    const content = latest.plan as unknown as LearningPlanContent;
    return res.json({
      success: true,
      plan: {
        id: latest.id,
        targetRole: latest.targetRole,
        createdAt: latest.createdAt,
        summary: content.summary,
        priorities: content.priorities,
      },
    });
  } catch (error) {
    console.error("Learning plan fetch error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Could not load your learning plan" });
  }
});

/* ---------- POST /api/learning/plan : generate a fresh plan ---------- */

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Try again later." },
});

router.post("/plan", generateLimiter, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const [analysis, attempts] = await Promise.all([
      prisma.resumeAnalysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.interviewAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    // Source 1: skills missing from the latest resume analysis
    const missingSkills = analysis ? toStringArray(analysis.missingSkills) : [];

    // Source 2: weak points from recent interview practice, grouped by skill
    const bySkill = new Map<string, { scores: number[]; weaknesses: Set<string> }>();
    for (const a of attempts) {
      const entry = bySkill.get(a.skill) ?? {
        scores: [],
        weaknesses: new Set<string>(),
      };
      entry.scores.push(a.score);
      toStringArray(a.weaknesses).forEach((w) => entry.weaknesses.add(w));
      bySkill.set(a.skill, entry);
    }

    const interviewSkills: InterviewSkillStat[] = Array.from(bySkill.entries())
      .map(([skill, { scores, weaknesses }]) => ({
        skill,
        attempts: scores.length,
        averageScore: Math.round(
          scores.reduce((sum, s) => sum + s, 0) / scores.length
        ),
        weaknesses: Array.from(weaknesses).slice(0, 6),
      }))
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 8);

    const hasWeakPoints = interviewSkills.some((s) => s.weaknesses.length > 0);

    if (missingSkills.length === 0 && !hasWeakPoints) {
      return res.status(400).json({
        success: false,
        error:
          "We need something to build your plan from. Run the Resume Analyzer or practice an interview first.",
      });
    }

    const targetRole =
      analysis?.targetRole ?? attempts[0]?.role ?? "Software Developer";

    const content = await generateLearningPlan({
      targetRole,
      missingSkills,
      interviewSkills,
    });

    if (content.priorities.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Could not build a plan. Please try again.",
      });
    }

    const saved = await prisma.learningPlan.create({
      data: { userId, targetRole, plan: content },
    });

    return res.json({
      success: true,
      plan: {
        id: saved.id,
        targetRole: saved.targetRole,
        createdAt: saved.createdAt,
        summary: content.summary,
        priorities: content.priorities,
      },
    });
  } catch (error) {
    console.error("Learning plan generation error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not build your learning plan. Please try again.",
    });
  }
});

export default router;