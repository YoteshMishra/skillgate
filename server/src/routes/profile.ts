import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../prismaClient";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, "..", "..", "uploads", "resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as Request).user?.userId ?? "unknown";
    const ext = path.extname(file.originalname);
    const uniqueName = `user-${userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
    }
  },
});

// Fields counted toward profile completeness
const COMPLETENESS_FIELDS = [
  "phone",
  "location",
  "summary",
  "skills",
  "education",
  "experience",
  "resumeUrl",
] as const;

function calculateCompleteness(profile: Record<string, any> | null): number {
  if (!profile) return 0;
  const filled = COMPLETENESS_FIELDS.filter(
    (field) => profile[field] && String(profile[field]).trim() !== ""
  ).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

// GET /api/profile/me — job seeker's own profile (creates an empty one if none exists)
router.get(
  "/me",
  requireAuth,
  requireRole("JOB_SEEKER"),
  async (req: Request, res: Response) => {
    try {
      let profile = await prisma.profile.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!profile) {
        profile = await prisma.profile.create({
          data: { userId: req.user!.userId },
        });
      }

      const completeness = calculateCompleteness(profile);
      res.json({ profile, completeness });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
);

// PUT /api/profile/me — update text fields of the profile
router.put(
  "/me",
  requireAuth,
  requireRole("JOB_SEEKER"),
  async (req: Request, res: Response) => {
    try {
      const { phone, location, summary, skills, education, experience } = req.body;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user!.userId },
        update: { phone, location, summary, skills, education, experience },
        create: {
          userId: req.user!.userId,
          phone,
          location,
          summary,
          skills,
          education,
          experience,
        },
      });

      const completeness = calculateCompleteness(profile);
      res.json({ profile, completeness });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// POST /api/profile/resume — upload/replace resume file
router.post(
  "/resume",
  requireAuth,
  requireRole("JOB_SEEKER"),
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const resumeUrl = `/uploads/resumes/${req.file.filename}`;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user!.userId },
        update: { resumeUrl, resumeName: req.file.originalname },
        create: {
          userId: req.user!.userId,
          resumeUrl,
          resumeName: req.file.originalname,
        },
      });

      const completeness = calculateCompleteness(profile);
      res.json({ profile, completeness });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload resume" });
    }
  }
);

export default router;