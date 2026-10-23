import * as live from "./interviewAI";
import { runWithFallback } from "./aiGuard";
import {
  fallbackEvaluation,
  fallbackQuestion,
  fallbackRecommendations,
  type Difficulty,
} from "./fallbackData";

export function generateQuestion(
  role: string,
  skill: string,
  difficulty: Difficulty,
  previousQuestions: string[]
) {
  return runWithFallback(
    "generateQuestion",
    () => live.generateQuestion(role, skill, difficulty, previousQuestions),
    () => fallbackQuestion(role, skill, difficulty, previousQuestions)
  );
}

export function evaluateAnswer(
  role: string,
  skill: string,
  difficulty: Difficulty,
  question: string,
  answer: string
) {
  return runWithFallback(
    "evaluateAnswer",
    () => live.evaluateAnswer(role, skill, difficulty, question, answer),
    () => fallbackEvaluation(role, skill, difficulty, question, answer)
  );
}

export function getRecommendations(
  role: string,
  skill: string,
  weakTopics: string[]
) {
  return runWithFallback(
    "getRecommendations",
    () => live.getRecommendations(role, skill, weakTopics),
    () => fallbackRecommendations(role, skill, weakTopics)
  );
}