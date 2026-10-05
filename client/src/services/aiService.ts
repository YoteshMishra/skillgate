import api from "../api/axios";

/* ---------- Resume analyzer (unchanged) ---------- */

export interface ResumeAnalysis {
  id?: number;
  targetRole: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceSummary: string;
  recommendations: string[];
}

export async function analyzeResume(
  file: File,
  targetRole: string
): Promise<ResumeAnalysis> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("targetRole", targetRole);

  try {
    // axios sets the multipart header itself; the interceptor adds the token
    const response = await api.post("/ai/analyze-resume", formData);
    return response.data.analysis;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || "Resume analysis failed");
  }
}

/* ---------- Interview practice ---------- */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  betterAnswer: string;
}

export interface InterviewRecommendation {
  topic: string;
  reason: string;
}

export interface InterviewSummary {
  attemptCount: number;
  averageScore: number;
  weakTopics: string[];
  recommendations: InterviewRecommendation[];
}

interface InterviewContext {
  role: string;
  skill: string;
  difficulty: Difficulty;
}

export async function generateQuestion(
  params: InterviewContext & { previousQuestions: string[] }
): Promise<string> {
  try {
    const response = await api.post("/interview/question", params);
    return response.data.question;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.error || "Could not generate a question"
    );
  }
}

export async function evaluateAnswer(
  params: InterviewContext & { question: string; answer: string }
): Promise<{ attemptId: number; evaluation: AnswerEvaluation }> {
  try {
    const response = await api.post("/interview/evaluate", params);
    return {
      attemptId: response.data.attemptId,
      evaluation: response.data.evaluation,
    };
  } catch (err: any) {
    throw new Error(
      err.response?.data?.error || "Could not evaluate your answer"
    );
  }
}

export async function getInterviewSummary(
  attemptIds: number[]
): Promise<InterviewSummary> {
  try {
    const response = await api.post("/interview/summary", { attemptIds });
    return response.data.summary;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.error || "Could not build your summary"
    );
  }
}

/* ---------- Learning plan ---------- */

export type PlanSource = "RESUME" | "INTERVIEW" | "BOTH";
export type PlanPriority = "HIGH" | "MEDIUM" | "LOW";

export interface LearningPriority {
  topic: string;
  reason: string;
  source: PlanSource;
  priority: PlanPriority;
  steps: string[];
}

export interface LearningPlan {
  id: number;
  targetRole: string;
  createdAt: string;
  summary: string;
  priorities: LearningPriority[];
}

// Returns null when the user has no saved plan yet
export async function getLearningPlan(): Promise<LearningPlan | null> {
  try {
    const response = await api.get("/learning/plan");
    return response.data.plan;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.error || "Could not load your learning plan"
    );
  }
}

export async function generateLearningPlan(): Promise<LearningPlan> {
  try {
    const response = await api.post("/learning/plan");
    return response.data.plan;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.error || "Could not build your learning plan"
    );
  }
}