export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  betterAnswer: string;
}

export interface Recommendation {
  topic: string;
  reason: string;
}