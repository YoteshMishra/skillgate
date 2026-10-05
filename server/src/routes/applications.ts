import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const VALID_STATUSES = ["PENDING", "REVIEWED", "ACCEPTED", "REJECTED"];

// POST /api/applications — protected, job seeker only
router.post(
  "/",
  requireAuth,
  requireRole("JOB_SEEKER"),
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: "jobId is required" });
      }

      const job = await prisma.job.findUnique({ where: { id: Number(jobId) } });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const application = await prisma.application.create({
        data: {
          userId: req.user!.userId,
          jobId: Number(jobId),
        },
      });

      res.status(201).json({ application });
    } catch (err: any) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "You already applied to this job" });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to submit application" });
    }
  }
);

// GET /api/applications/me — protected, job seeker's own applications
router.get(
  "/me",
  requireAuth,
  requireRole("JOB_SEEKER"),
  async (req: Request, res: Response) => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.user!.userId },
        include: {
          job: {
            select: { id: true, title: true, company: true, location: true },
          },
        },
        orderBy: { appliedAt: "desc" },
      });

      res.json({ applications });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  }
);

// GET /api/applications/job/:jobId — protected, recruiter-only, applicants for their own job
router.get(
  "/job/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const jobId = Number(req.params.jobId);

      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      if (job.postedById !== req.user!.userId) {
        return res.status(403).json({ error: "You did not post this job" });
      }

      const applications = await prisma.application.findMany({
        where: { jobId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { appliedAt: "desc" },
      });

      res.json({ applications });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch applicants" });
    }
  }
);

// PATCH /api/applications/:id/status — protected, recruiter-only, updates an applicant's status
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }

      const application = await prisma.application.findUnique({
        where: { id },
        include: { job: true },
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (application.job.postedById !== req.user!.userId) {
        return res.status(403).json({ error: "You did not post this job" });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { status },
      });

      res.json({ application: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update application status" });
    }
  }
);

export default router;