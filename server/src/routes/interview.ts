import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import prisma from "../prismaClient";
import { requireAuth } from "../middleware/auth";
import {
  evaluateAnswer,
  generateQuestion,
  getRecommendations,
} from "../services/interviewAI";

const router = express.Router();

router.use(requireAuth);

// Protects your Hugging Face quota
router.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Try again later." },
  }),
);

const baseSchema = z.object({
  role: z.string().trim().min(2).max(80),
  skill: z.string().trim().min(2).max(60),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
});

/* ---------- POST /api/interview/question ---------- */

const questionBody = baseSchema.extend({
  previousQuestions: z.array(z.string().max(500)).max(20).default([]),
});

router.post("/question", async (req, res) => {
  const parsed = questionBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, error: "Role and skill are required" });
  }

  const { role, skill, difficulty, previousQuestions } = parsed.data;

  try {
    const question = await generateQuestion(
      role,
      skill,
      difficulty,
      previousQuestions,
    );
    return res.json({ success: true, question });
  } catch (error) {
    console.error("Interview question error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not generate a question. Please try again.",
    });
  }
});

/* ---------- POST /api/interview/evaluate ---------- */

const evaluateBody = baseSchema.extend({
  question: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(1).max(3000),
});

router.post("/evaluate", async (req, res) => {
  const parsed = evaluateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Please write an answer (max 3000 characters)",
    });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { role, skill, difficulty, question, answer } = parsed.data;

  try {
    const evaluation = await evaluateAnswer(
      role,
      skill,
      difficulty,
      question,
      answer,
    );

    const attempt = await prisma.interviewAttempt.create({
      data: {
        userId,
        role,
        skill,
        difficulty,
        question,
        answer,
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        feedback: evaluation.feedback,
        betterAnswer: evaluation.betterAnswer,
      },
    });

    return res.json({ success: true, attemptId: attempt.id, evaluation });
  } catch (error) {
    console.error("Interview evaluation error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not evaluate your answer. Please try again.",
    });
  }
});

/* ---------- POST /api/interview/summary ---------- */

const summaryBody = z.object({
  attemptIds: z.array(z.number().int().positive()).min(1).max(20),
});

router.post("/summary", async (req, res) => {
  const parsed = summaryBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, error: "attemptIds are required" });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    // userId in the filter means users can only summarize their own attempts
    const attempts = await prisma.interviewAttempt.findMany({
      where: { userId, id: { in: parsed.data.attemptIds } },
      orderBy: { createdAt: "asc" },
    });

    if (attempts.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No attempts found" });
    }

    const averageScore = Math.round(
      attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
    );

    const weakTopics = Array.from(
      new Set(
        attempts.flatMap((a) =>
          Array.isArray(a.weaknesses)
            ? a.weaknesses.filter((w): w is string => typeof w === "string")
            : [],
        ),
      ),
    ).slice(0, 12);

    const first = attempts[0];
    if (!first) {
      return res
        .status(404)
        .json({ success: false, error: "No attempts found" });
    }
    const recommendations = await getRecommendations(
      first.role,
      first.skill,
      weakTopics,
    );

    return res.json({
      success: true,
      summary: {
        attemptCount: attempts.length,
        averageScore,
        weakTopics,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Interview summary error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not build your summary. Please try again.",
    });
  }
});

export default router;
