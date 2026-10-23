import { generateLearningPlan as generateLearningPlanLive } from "./learningAI";
import { runWithFallback } from "./aiGuard";
import { fallbackLearningPlan } from "./fallbackData";
import type { InterviewSkillStat } from "../types/learning";

export function generateLearningPlan(input: {
  targetRole: string;
  missingSkills: string[];
  interviewSkills: InterviewSkillStat[];
}) {
  return runWithFallback(
    "generateLearningPlan",
    () => generateLearningPlanLive(input),
    () => fallbackLearningPlan(input)
  );
}