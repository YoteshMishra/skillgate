import type { ResumeAnalysisResult } from "../types/resumeAnalysis";
import type {
  InterviewSkillStat,
  LearningPlanContent,
  LearningPriority,
  PlanPriority,
  PlanSource,
} from "../types/learning";

/*
 * Built-in fallback used when Hugging Face is unavailable (expired token,
 * quota, timeout, bad response). Nothing here calls an AI model: results are
 * built from static per-role data and picked deterministically from the
 * candidate's own input, so different candidates get different output but the
 * same candidate gets a stable one.
 */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

// IMPORTANT: set this to the scale your live interview scoring uses
// (check the prompt in services/interviewAI.ts: "score 0-10" or "0-100").
export const INTERVIEW_SCORE_MAX = 10;

/* ---------------------------- helpers ---------------------------- */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length] as T;
}

function pickN<T>(items: readonly T[], count: number, seed: number): T[] {
  const out: T[] = [];
  const n = Math.min(count, items.length);
  for (let i = 0; i < n; i++) out.push(items[(seed + i) % items.length] as T);
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whole-word match so "java" does not match "javascript"
function hasSkill(lowerText: string, skill: string): boolean {
  const pattern = new RegExp(
    "(?<![a-z0-9+#])" + escapeRegExp(skill.toLowerCase()) + "s?(?![a-z0-9+#])"
  );
  return pattern.test(lowerText);
}

function detectYears(text: string): number | null {
  let max = 0;
  const re = /(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    if (n > max && n <= 40) max = n;
  }
  return max > 0 ? max : null;
}

/* ------------------------- role profiles ------------------------- */

type RoleKey =
  | "fullstack"
  | "mobile"
  | "data"
  | "devops"
  | "qa"
  | "frontend"
  | "backend"
  | "general";

interface RoleProfile {
  label: string;
  keywords: string[];
  skills: string[];
  tips: string[];
}

const ROLE_PROFILES: Record<RoleKey, RoleProfile> = {
  fullstack: {
    label: "full-stack",
    keywords: ["full stack", "full-stack", "fullstack", "mern", "mean stack"],
    skills: ["React", "Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "REST API", "Authentication", "Git", "Docker", "HTML", "CSS", "Testing", "Deployment"],
    tips: [
      "Ship one end-to-end project with auth, a database and a live deployment, and link it on your resume.",
      "Show both sides of the stack: pair every frontend bullet with the API or data work behind it.",
      "Add measurable outcomes (load time, users, uptime) to your project bullets.",
      "Learn how your app behaves in production: logging, error handling and environment configuration.",
    ],
  },
  mobile: {
    label: "mobile",
    keywords: ["android", "ios", "mobile", "flutter", "react native", "swift", "kotlin"],
    skills: ["React Native", "Flutter", "Kotlin", "Swift", "Android", "iOS", "REST API", "Firebase", "State management", "Git", "Push notifications", "App Store", "Redux", "Unit testing"],
    tips: [
      "Publish or demo at least one app and include store links or screen recordings.",
      "Show you understand app performance: startup time, memory and offline behaviour.",
      "Mention how you handle navigation, state and API errors in your apps.",
      "Add device-testing details (screen sizes, OS versions) to your project bullets.",
    ],
  },
  data: {
    label: "data",
    keywords: ["data scientist", "data analyst", "data engineer", "machine learning", "ml engineer", "ai engineer", "analytics", "deep learning"],
    skills: ["Python", "SQL", "Pandas", "NumPy", "Machine learning", "Scikit-learn", "TensorFlow", "Data visualization", "Statistics", "Power BI", "Tableau", "Feature engineering", "Jupyter", "ETL"],
    tips: [
      "Add a project that goes from raw data to a clear business insight, with the numbers that mattered.",
      "Show the metrics you optimised and why you chose them, not just the models you used.",
      "Include a dashboard or visualisation people can open, not only notebooks.",
      "Mention data size and cleaning effort; it signals real-world experience.",
    ],
  },
  devops: {
    label: "DevOps",
    keywords: ["devops", "sre", "site reliability", "cloud", "infrastructure", "platform engineer"],
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux", "Jenkins", "Ansible", "Monitoring", "Git", "Bash", "Prometheus", "Networking", "GitHub Actions"],
    tips: [
      "Describe a pipeline you built end to end, including how long deployments took before and after.",
      "Show infrastructure as code: link a repo with Terraform or Ansible you wrote.",
      "Add incident or reliability examples: what broke, how you found it, what you changed.",
      "Mention cost and security improvements with real numbers.",
    ],
  },
  qa: {
    label: "QA",
    keywords: ["qa", "quality", "tester", "test engineer", "sdet"],
    skills: ["Test cases", "Selenium", "Cypress", "Playwright", "Postman", "API testing", "Regression testing", "JIRA", "Automation", "Manual testing", "SQL", "Git", "Test plans", "Bug reporting"],
    tips: [
      "Show automation you wrote: a framework or suite with coverage and run-time numbers.",
      "Describe a serious bug you found and the impact it would have had.",
      "Add API testing examples alongside UI testing.",
      "Mention how you decide what to automate and what to keep manual.",
    ],
  },
  frontend: {
    label: "frontend",
    keywords: ["frontend", "front-end", "front end", "react", "angular", "vue", "javascript", "typescript", "ui developer", "ui engineer", "web developer"],
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Redux", "Next.js", "Tailwind CSS", "REST API", "Git", "Jest", "Accessibility", "Responsive design", "Vite"],
    tips: [
      "Link live projects and show performance results such as Lighthouse scores or load times.",
      "Add accessibility and responsive-design work to your project bullets.",
      "Show how you manage state and data fetching in larger apps.",
      "Include testing: component tests or end-to-end tests you wrote.",
    ],
  },
  backend: {
    label: "backend",
    keywords: ["backend", "back-end", "back end", "node", "java", "python", "django", "spring", ".net", "golang", "api developer", "server"],
    skills: ["Node.js", "Express", "Python", "Java", "SQL", "PostgreSQL", "MongoDB", "REST API", "Authentication", "Docker", "Redis", "Microservices", "Git", "Unit testing"],
    tips: [
      "Describe an API you designed, including scale (requests per second, users) and how you secured it.",
      "Show database design skills: schema choices, indexing and query tuning.",
      "Add caching, queues or background jobs to show you can handle load.",
      "Mention testing and monitoring for your services.",
    ],
  },
  general: {
    label: "software",
    keywords: [],
    skills: ["Data structures", "Algorithms", "Git", "SQL", "REST API", "Testing", "Problem solving", "Object-oriented programming", "Debugging", "System design", "Agile", "Documentation", "Databases", "Version control"],
    tips: [
      "Add two or three projects with links, a short description and the result they achieved.",
      "Lead each bullet with an action and finish with a measurable outcome.",
      "Show teamwork: code reviews, pairing or shipping with a team.",
      "Tailor the skills section to the exact role you are applying for.",
    ],
  },
};

const ROLE_ORDER: RoleKey[] = [
  "fullstack",
  "mobile",
  "data",
  "devops",
  "qa",
  "frontend",
  "backend",
];

function detectRole(role: string): RoleKey {
  const lower = role.toLowerCase();
  for (const key of ROLE_ORDER) {
    if (ROLE_PROFILES[key].keywords.some((k) => lower.includes(k))) return key;
  }
  return "general";
}

/* ----------------------- 1. resume analysis ----------------------- */

export function fallbackResumeAnalysis(
  resumeText: string,
  targetRole: string
): ResumeAnalysisResult {
  const profile = ROLE_PROFILES[detectRole(targetRole)];
  const lowerText = resumeText.toLowerCase();
  const seed = hash(targetRole.toLowerCase() + "|" + resumeText.slice(0, 600));

  const matchedSkills = profile.skills.filter((s) => hasSkill(lowerText, s));
  const missingSkills = profile.skills
    .filter((s) => !hasSkill(lowerText, s))
    .slice(0, 6);

  const ratio = matchedSkills.length / profile.skills.length;
  // Score reflects only the skills actually found in the resume
  const matchPercentage = Math.max(20, Math.min(92, Math.round(ratio * 100)));

  const years = detectYears(resumeText);
  const yearsPart = years
    ? `, with roughly ${years} year${years === 1 ? "" : "s"} of experience mentioned`
    : "";
  const topSkills = matchedSkills.slice(0, 3).join(", ");

  const openers = [
    `Your resume covers ${matchedSkills.length} of ${profile.skills.length} core ${profile.label} skills for a ${targetRole} role${yearsPart}.`,
    `For a ${targetRole} position, your resume shows ${matchedSkills.length} relevant ${profile.label} skills${topSkills ? `, led by ${topSkills}` : ""}${yearsPart}.`,
    `The resume lines up with ${matchedSkills.length} of the ${profile.skills.length} skills commonly expected of a ${targetRole}${yearsPart}.`,
  ];
  const closing =
    ratio >= 0.6
      ? "It is a strong base; focus on proving depth with measurable results."
      : ratio >= 0.3
      ? "There is a solid base, with clear gaps to close before applying."
      : "There are significant gaps; building projects around the missing skills would help most.";

  const gapPhrases: Array<(skill: string) => string> = [
    (s) => `Add a project or work bullet that shows hands-on ${s} experience.`,
    (s) => `Learn the fundamentals of ${s} and mention it with a concrete outcome on your resume.`,
    (s) => `Build a small portfolio piece using ${s} and link it from your resume.`,
  ];
  const gapRecs = missingSkills
    .slice(0, 3)
    .map((s, i) => pick(gapPhrases, seed + i)(s));

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    experienceSummary: `${pick(openers, seed)} ${closing}`,
    recommendations: [...gapRecs, ...pickN(profile.tips, 2, seed)],
  };
}

/* ------------------------ 2. interview ------------------------ */

const QUESTION_TEMPLATES: Record<Difficulty, string[]> = {
  EASY: [
    "In your own words, what is {skill} and where would you use it as a {role}?",
    "What problem does {skill} solve, and what are its core concepts?",
    "Describe a simple task you have done with {skill}. What steps did you follow?",
    "What are the most common mistakes beginners make with {skill}?",
    "How would you explain {skill} to a teammate who has never used it?",
    "Which parts of {skill} do you use most often in day-to-day {role} work?",
  ],
  MEDIUM: [
    "Walk me through how you would structure a medium-sized feature using {skill}. What trade-offs would you consider?",
    "How do you debug a hard-to-reproduce issue in a {skill} project?",
    "What are the performance pitfalls of {skill}, and how do you avoid them?",
    "How do you test code that depends on {skill}? What would you mock, and why?",
    "Describe a time {skill} did not behave as you expected. What did you learn?",
    "How would you review a teammate's {skill} code? What do you look for first?",
  ],
  HARD: [
    "Design a scalable solution for a high-traffic {role} use case built around {skill}. Where would the bottlenecks be?",
    "What are the architectural limits of {skill}, and when would you choose an alternative?",
    "How would you migrate a large legacy codebase to {skill} with minimal downtime and risk?",
    "Describe how you would monitor, secure and maintain a production system that relies heavily on {skill}.",
    "Compare two different approaches to solving a complex problem with {skill}. Defend your choice.",
    "How would you help a team adopt best practices for {skill} across several services?",
  ],
};

export function fallbackQuestion(
  role: string,
  skill: string,
  difficulty: Difficulty,
  previousQuestions: string[]
): string {
  const rendered = QUESTION_TEMPLATES[difficulty].map((t) =>
    t.replace(/\{skill\}/g, skill).replace(/\{role\}/g, role)
  );
  const unused = rendered.filter((q) => !previousQuestions.includes(q));
  const pool = unused.length > 0 ? unused : rendered;
  const seed = hash(`${role}|${skill}|${difficulty}`) + previousQuestions.length;
  return pick(pool, seed);
}

export function fallbackEvaluation(
  role: string,
  skill: string,
  difficulty: Difficulty,
  question: string,
  answer: string
): {
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  betterAnswer: string;
} {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;

  const mentionsSkill = lower.includes(skill.toLowerCase());
  const hasExample =
    /\b(for example|for instance|e\.g\.|in my project|i built|i used|i implemented|i worked|at my (?:last |previous )?(?:job|company))\b/i.test(text);
  const hasReasoning =
    /\b(because|therefore|so that|trade-?offs?|since|which means|as a result)\b/i.test(text);
  const hasStructure = /\b(first|second|third|then|next|finally|step)\b/i.test(text);
  const hasCode = /[`{}();=<>]/.test(text);

  const questionWords = Array.from(
    new Set(question.toLowerCase().match(/[a-z]{5,}/g) ?? [])
  );
  const hits = questionWords.filter((w) => lower.includes(w)).length;
  const relevance = questionWords.length > 0 ? hits / questionWords.length : 0;

  let raw = 2;
  raw += Math.min(3, words / 40);
  if (mentionsSkill) raw += 1.5;
  if (hasExample) raw += 1.5;
  if (hasReasoning) raw += 1;
  if (hasStructure) raw += 0.5;
  if (hasCode) raw += 0.5;
  raw += relevance * 0.5;
  if (difficulty === "HARD") raw -= 1;
  else if (difficulty === "EASY") raw += 0.5;
  if (words < 8) raw = Math.min(raw, 2);
  raw = Math.max(1, Math.min(10, raw));

  const score = Math.max(1, Math.round((raw / 10) * INTERVIEW_SCORE_MAX));

  const strengths: string[] = [];
  if (mentionsSkill) strengths.push(`Addressed ${skill} directly`);
  if (hasExample) strengths.push("Backed the answer with a concrete example");
  if (hasReasoning) strengths.push("Explained the reasoning behind the approach");
  if (hasStructure) strengths.push("Clear, step-by-step structure");
  if (words >= 80) strengths.push("Good level of detail");
  if (strengths.length === 0) strengths.push("Made a genuine attempt at the question");

  const weaknesses: string[] = [];
  if (!mentionsSkill) weaknesses.push(`Did not mention ${skill} directly`);
  if (!hasExample) weaknesses.push("No real-world example given");
  if (!hasReasoning) weaknesses.push("Little explanation of why or the trade-offs");
  if (words < 40) weaknesses.push("Answer was too brief for this question");
  if (!hasStructure) weaknesses.push("Could be organised more clearly");
  if (weaknesses.length === 0)
    weaknesses.push("Could go deeper on edge cases and failure modes");

  const ratio = raw / 10;
  const seed = hash(answer);
  const lead =
    ratio >= 0.75
      ? "Strong answer. You covered the topic with good depth and clear reasoning."
      : ratio >= 0.5
      ? "A reasonable answer. The core idea is there, but it needs more specifics and a concrete example."
      : "This answer is a start, but it is too thin. Define the concept, explain when to use it, and back it up with an example.";
  const closer = pick(
    [
      "Aim for this shape: definition, example, then trade-offs.",
      "Tie your answer back to a real situation you have faced as a " + role + ".",
      "Finish by naming one limitation or alternative; it shows judgement.",
    ],
    seed
  );

  const betterAnswer =
    `A stronger answer would define ${skill} clearly, explain when a ${role} would use it, ` +
    `walk through a concrete example from your own work, and end with the trade-offs you considered` +
    (difficulty === "HARD" ? ", including scalability, failure modes and monitoring." : ".");

  return {
    score,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    feedback: `${lead} ${closer}`,
    betterAnswer,
  };
}

export function fallbackRecommendations(
  role: string,
  skill: string,
  weakTopics: string[]
): Array<{ topic: string; reason: string }> {
  const seed = hash(`${role}|${skill}|${weakTopics.join(",")}`);
  const reasons = [
    "This came up as a weak point in your practice answers. Revisit the fundamentals, then practise explaining it with a real example.",
    "Your answers showed gaps here. Work through a small hands-on exercise and review common interview questions on it.",
    "Strengthening this will lift your overall answers. Read the official docs and write a short summary in your own words.",
  ];

  const fromWeak = weakTopics
    .slice(0, 4)
    .map((topic, i) => ({ topic, reason: pick(reasons, seed + i) }));

  const own = skill.toLowerCase();
  const extras = pickN(ROLE_PROFILES[detectRole(role)].skills, 3, seed)
    .filter((s) => s.toLowerCase() !== own)
    .slice(0, 2)
    .map((s) => ({
      topic: s,
      reason: `Commonly expected in ${role} interviews and worth practising next.`,
    }));

  const base =
    fromWeak.length === 0
      ? [{ topic: `${skill} fundamentals`, reason: pick(reasons, seed) }]
      : [];

  return [...fromWeak, ...base, ...extras].slice(0, 5);
}

/* ----------------------- 3. learning plan ----------------------- */

const STEP_TEMPLATES = [
  "Review the core concepts of {t} using the official documentation.",
  "Build a small hands-on project that uses {t}.",
  "Practise explaining {t} out loud with one real example.",
  "Answer three interview-style questions on {t} and review your weak points.",
  "Read two well-regarded articles or tutorials on {t} and note what you did not know.",
  "Add {t} to a project you already have and write down what you learned.",
];

function stepsFor(topic: string, count: number, seed: number): string[] {
  return pickN(STEP_TEMPLATES, count, seed).map((s) => s.replace(/\{t\}/g, topic));
}

export function fallbackLearningPlan(input: {
  targetRole: string;
  missingSkills: string[];
  interviewSkills: InterviewSkillStat[];
}): LearningPlanContent {
  const { targetRole, missingSkills, interviewSkills } = input;
  const seed = hash(
    targetRole +
      "|" +
      missingSkills.join(",") +
      "|" +
      interviewSkills.map((s) => s.skill).join(",")
  );

  type Entry = {
    topic: string;
    reasons: string[];
    resume: boolean;
    interview: boolean;
    rank: number;
  };
  const map = new Map<string, Entry>();

  interviewSkills.forEach((s, i) => {
    if (s.weaknesses.length === 0) return;
    const gaps = s.weaknesses.slice(0, 2).join("; ");
    map.set(s.skill.toLowerCase(), {
      topic: s.skill,
      reasons: [`Practice answers on ${s.skill} showed gaps: ${gaps}.`],
      resume: false,
      interview: true,
      rank: i,
    });
  });

  missingSkills.slice(0, 6).forEach((skill, i) => {
    const key = skill.toLowerCase();
    const reason = `${skill} is missing from your resume for ${targetRole} roles.`;
    const existing = map.get(key);
    if (existing) {
      existing.resume = true;
      existing.reasons.push(reason);
      existing.rank = Math.min(existing.rank, i);
    } else {
      map.set(key, { topic: skill, reasons: [reason], resume: true, interview: false, rank: i });
    }
  });

  const sorted = Array.from(map.values())
    .sort((a, b) => {
      const aBoth = a.resume && a.interview ? 0 : 1;
      const bBoth = b.resume && b.interview ? 0 : 1;
      return aBoth - bBoth || a.rank - b.rank;
    })
    .slice(0, 6);

  const priorities: LearningPriority[] = sorted.map((e, idx) => {
    const source: PlanSource =
      e.resume && e.interview ? "BOTH" : e.resume ? "RESUME" : "INTERVIEW";
    const priority: PlanPriority =
      source === "BOTH" || idx < 2 ? "HIGH" : idx < 4 ? "MEDIUM" : "LOW";
    const stepCount = priority === "HIGH" ? 4 : priority === "MEDIUM" ? 3 : 2;
    return {
      topic: e.topic,
      reason: e.reasons.join(" "),
      source,
      priority,
      steps: stepsFor(e.topic, stepCount, seed + idx),
    };
  });

  const lead = priorities[0]?.topic ?? targetRole;
  const n = priorities.length;
  const summary = pick(
    [
      `This plan focuses on ${n} area${n === 1 ? "" : "s"} to strengthen for a ${targetRole} role, starting with ${lead}.`,
      `To get closer to a ${targetRole} role, work through these ${n} priorities, beginning with ${lead}.`,
      `Your next ${n} study priorities for a ${targetRole} role are listed below; ${lead} comes first.`,
    ],
    seed
  );

  return { summary, priorities };
}