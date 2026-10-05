import "dotenv/config"; // must stay the first line
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import authRoutes from "./routes/auth";
import jobRoutes from "./routes/jobs";
import applicationRoutes from "./routes/applications";
import profileRoutes from "./routes/profile";
import candidateRoutes from "./routes/candidates";
import aiRoutes from "./routes/ai";
import interviewRoutes from "./routes/interview";
import learningRoutes from "./routes/learning";
import passwordResetRoutes from "./routes/passwordReset";
import { startCleanupJob, runCleanup } from "./services/cleanup";

const app = express();

// Render assigns the port through the PORT environment variable
const PORT = Number(process.env.PORT) || 3000;

// Only your frontend may call this API (no trailing slash)
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

// Render sits behind a proxy. Without this, rate limiting sees every user as one IP.
app.set("trust proxy", 1);

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", passwordResetRoutes); // forgot-password and reset-password
app.use("/api/auth", authRoutes);          // register and login
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/learning", learningRoutes);

// Error handler: must come after all routes
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      error: tooLarge
        ? "File too large (max 5 MB)"
        : `Upload error: ${err.message}`,
    });
  }

  if (err instanceof Error && err.message === "Only PDF files are allowed") {
    return res.status(400).json({ success: false, error: err.message });
  }

  next(err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCleanupJob();
  runCleanup().catch((err) => console.error("[cleanup] FAILED:", err));
});