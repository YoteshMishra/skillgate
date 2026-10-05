import { z } from "zod";
import { askJSON } from "./interviewAI";
import type {
  InterviewSkillStat,
  LearningPlanContent,
  PlanPriority,
  PlanSource,
} from "../types/learning";

const planSchema = z.object({
  summary: z.string(),
  priorities: z.array(
    z.object({
      topic: z.string(),
      reason: z.string(),
      source: z.string(),
      priority: z.string(),
      steps: z.array(z.string()),
    })
  ),
});

function normalizeSource(value: string): PlanSource {
  const v = value.trim().toUpperCase();
  if (v === "RESUME" || v === "INTERVIEW" || v === "BOTH") return v;
  return "BOTH";
}

function normalizePriority(value: string): PlanPriority {
  const v = value.trim().toUpperCase();
  if (v === "HIGH" || v === "MEDIUM" || v === "LOW") return v;
  return "MEDIUM";
}

const ORDER: Record<PlanPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export async function generateLearningPlan(input: {
  targetRole: string;
  missingSkills: string[];
  interviewSkills: InterviewSkillStat[];
}): Promise<LearningPlanContent> {
  const raw = await askJSON(
    `You are a career coach building a personal learning plan for a job seeker.
You receive two data sources:
1. "resumeMissingSkills": skills the target role needs that their resume lacks.
2. "interviewPractice": per-skill results from practice interviews (average score 0-100 and the weak points found).

Reply with JSON only, in this exact shape:
{"summary": "", "priorities": [{"topic": "", "reason": "", "source": "RESUME", "priority": "HIGH", "steps": []}]}

Rules:
Rules:
- Merge duplicates of the same skill into one topic.
- "source" is RESUME, INTERVIEW or BOTH, depending on where the topic came from.
- "priority" is HIGH, MEDIUM or LOW. Topics that appear in BOTH sources, or have low interview scores, are HIGH.
- Give 3 to 6 priorities, most important first.
- "reason" is one sentence tied to the data.
- "steps" is 3 or 4 concrete, actionable steps (practice tasks, a small project to build, official documentation to read). Each topic's steps must be self-contained: never refer to a project from another topic or assume the person already built or uses any tool. Do NOT include URLs or invent course names.
- "summary" is 2 sentences written directly to the reader using "you" (never "the candidate").
- "topic" names ONE skill area in at most 4 words (for example "React Testing" or "Next.js SSR"). Never combine several skills into one topic. Create separate priorities instead.
- Prefer free tools and tools that run on any operating system. Do not suggest paid software.`,
    JSON.stringify(
      {
        targetRole: input.targetRole,
        resumeMissingSkills: input.missingSkills,
        interviewPractice: input.interviewSkills,
      },
      null,
      2
    ),
    4000
  );

  const parsed = planSchema.parse(raw);

  const priorities = parsed.priorities
    .map((p) => ({
      topic: p.topic.trim(),
      reason: p.reason.trim(),
      source: normalizeSource(p.source),
      priority: normalizePriority(p.priority),
      steps: p.steps.map((s) => s.trim()).filter(Boolean).slice(0, 4),
    }))
    .filter((p) => p.topic.length > 0)
    .sort((a, b) => ORDER[a.priority] - ORDER[b.priority])
    .slice(0, 6);

  return { summary: parsed.summary.trim(), priorities };
}