export type PlanSource = "RESUME" | "INTERVIEW" | "BOTH";
export type PlanPriority = "HIGH" | "MEDIUM" | "LOW";

// `type` aliases (not interfaces) so they can be stored in a Prisma Json column
export type LearningPriority = {
  topic: string;
  reason: string;
  source: PlanSource;
  priority: PlanPriority;
  steps: string[];
};

export type LearningPlanContent = {
  summary: string;
  priorities: LearningPriority[];
};

export type InterviewSkillStat = {
  skill: string;
  attempts: number;
  averageScore: number;
  weaknesses: string[];
};