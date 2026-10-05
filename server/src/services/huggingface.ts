import { InferenceClient } from "@huggingface/inference";
import { ResumeAnalysisResult } from "../types/resumeAnalysis";

const hf = new InferenceClient(process.env.HF_TOKEN);

function isValidResult(data: any): data is ResumeAnalysisResult {
  return (
    data &&
    typeof data.matchPercentage === "number" &&
    Array.isArray(data.matchedSkills) &&
    Array.isArray(data.missingSkills) &&
    typeof data.experienceSummary === "string" &&
    Array.isArray(data.recommendations)
  );
}

export async function analyzeResume(
  resumeText: string,
  targetRole: string
): Promise<ResumeAnalysisResult> {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is missing from .env");
  }

  const prompt = `
You are an AI career assistant.

Analyze the following resume for the target role.

Target Role:
${targetRole}

Resume:
${resumeText.slice(0, 12000)}

Return ONLY valid JSON in this format:

{
  "matchPercentage": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "experienceSummary": "",
  "recommendations": []
}

Do not include markdown.
Do not include explanations outside the JSON.
`;

  const response = await hf.chatCompletion({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000,
    temperature: 0.2,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response received from Hugging Face");
  }

  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON: " + cleaned.slice(0, 200));
  }

  if (!isValidResult(parsed)) {
    throw new Error("AI response has an unexpected shape");
  }

  return {
    ...parsed,
    matchPercentage: Math.round(
      Math.min(100, Math.max(0, parsed.matchPercentage))
    ),
  };
}