import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/jobs — public, with optional search & filters
// Query params: search, location, company, datePosted (24h | 7d | 30d)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, location, company, datePosted } = req.query;

    const where: any = {};

    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location && typeof location === "string") {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (company && typeof company === "string") {
      where.company = { equals: company, mode: "insensitive" };
    }

    if (datePosted && typeof datePosted === "string") {
      const now = new Date();
      let since: Date | null = null;
      if (datePosted === "24h") since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (datePosted === "7d") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (datePosted === "30d") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (since) where.createdAt = { gte: since };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        postedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    res.json({ jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /api/jobs/filters — distinct locations & companies for filter dropdowns
router.get("/filters", async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      select: { location: true, company: true },
    });

    const locations = Array.from(
      new Set(jobs.map((j) => j.location).filter((l): l is string => !!l))
    ).sort();
    const companies = Array.from(new Set(jobs.map((j) => j.company))).sort();

    res.json({ locations, companies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// GET /api/jobs/mine — protected, recruiter-only, jobs posted by the logged-in recruiter
router.get(
  "/mine",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { postedById: req.user!.userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });
      res.json({ jobs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch your jobs" });
    }
  }
);

// GET /api/jobs/:id — public, single job details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        postedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// POST /api/jobs — protected, recruiter-only
router.post(
  "/",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const { title, description, company, location, salary } = req.body;

      if (!title || !description || !company) {
        return res
          .status(400)
          .json({ error: "title, description, and company are required" });
      }

      const job = await prisma.job.create({
        data: {
          title,
          description,
          company,
          location,
          salary,
          postedById: req.user!.userId,
        },
      });

      res.status(201).json({ job });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create job" });
    }
  }
);

export default router;