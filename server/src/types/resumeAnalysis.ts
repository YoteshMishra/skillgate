export interface ResumeAnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceSummary: string;
  recommendations: string[];
}