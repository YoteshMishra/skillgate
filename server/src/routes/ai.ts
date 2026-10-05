import express from "express";
import multer from "multer";
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