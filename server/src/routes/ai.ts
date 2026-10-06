import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { analyzeResume } from "../services/huggingface";
import { extractTextFromPdf } from "../services/pdfParser";
import prisma from "../prismaClient"; // keep whatever import your other routes use
import { requireAuth } from "../middleware/auth";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

/* ---------- Public resume analyzer (landing page, no login) ---------- */

// 3 analyses per hour per IP so strangers can't burn the Hugging Face quota
const publicAnalyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      "Free limit reached (3 analyses per hour). Please sign up to analyze more.",
  },
});

// Runs multer but returns JSON errors (wrong file type, file too large)
// instead of the default HTML error page
function uploadResume(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  upload.single("resume")(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
          ? "File is too large (max 5 MB)"
          : err instanceof Error
          ? err.message
          : "Upload failed";
      return res.status(400).json({ success: false, error: message });
    }
    next();
  });
}

router.post(
  "/analyze-resume-public",
  publicAnalyzeLimiter,
  uploadResume,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please upload a PDF resume",
        });
      }

      const targetRole =
        typeof req.body.targetRole === "string"
          ? req.body.targetRole.trim().slice(0, 100)
          : "";

      if (!targetRole) {
        return res.status(400).json({
          success: false,
          error: "Target role is required",
        });
      }

      let resumeText: string;
      try {
        resumeText = await extractTextFromPdf(req.file.buffer);
      } catch (err) {
        console.error("PDF extraction error (public):", err);
        return res.status(500).json({
          success: false,
          error: "Could not extract PDF text",
        });
      }

      if (!resumeText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Could not extract text from the PDF",
        });
      }

      const aiResult = await analyzeResume(resumeText, targetRole);

      // Nothing is saved to the database for public analyses
      return res.json({
        success: true,
        analysis: {
          targetRole,
          matchPercentage: aiResult.matchPercentage,
          matchedSkills: aiResult.matchedSkills,
          missingSkills: aiResult.missingSkills,
          experienceSummary: aiResult.experienceSummary,
          recommendations: aiResult.recommendations,
        },
      });
    } catch (error) {
      console.error("Public resume analysis error:", error);
      return res.status(500).json({
        success: false,
        error: "Resume analysis failed",
      });
    }
  }
);

/* ---------- Logged-in resume analyzer (unchanged) ---------- */

router.post(
  "/analyze-resume",
  requireAuth,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please upload a PDF resume",
        });
      }

      const targetRole =
        typeof req.body.targetRole === "string"
          ? req.body.targetRole.trim()
          : "";

      if (!targetRole) {
        return res.status(400).json({
          success: false,
          error: "Target role is required",
        });
      }

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      let resumeText: string;
      try {
        resumeText = await extractTextFromPdf(req.file.buffer);
      } catch (err) {
        console.error("PDF extraction error:", err);
        return res.status(500).json({
          success: false,
          error: "Could not extract PDF text",
        });
      }

      if (!resumeText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Could not extract text from the PDF",
        });
      }

      const aiResult = await analyzeResume(resumeText, targetRole);

      const analysis = await prisma.resumeAnalysis.create({
        data: {
          userId,
          targetRole,
          matchPercentage: aiResult.matchPercentage,
          matchedSkills: aiResult.matchedSkills,
          missingSkills: aiResult.missingSkills,
          experienceSummary: aiResult.experienceSummary,
          recommendations: aiResult.recommendations,
        },
      });

      return res.json({ success: true, analysis });
    } catch (error) {
      console.error("Resume analysis error:", error);
      return res.status(500).json({
        success: false,
        error: "Resume analysis failed",
      });
    }
  }
);

export default router;