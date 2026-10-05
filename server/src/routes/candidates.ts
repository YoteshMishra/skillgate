import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/candidates — protected, recruiter-only
// Query params: skills, location, search (matches name or summary)
router.get(
  "/",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const { skills, location, search } = req.query;

      const userWhere: any = { role: "JOB_SEEKER" };
      const profileWhere: any = {};

      if (skills && typeof skills === "string") {
        profileWhere.skills = { contains: skills, mode: "insensitive" };
      }
      if (location && typeof location === "string") {
        profileWhere.location = { contains: location, mode: "insensitive" };
      }

      if (search && typeof search === "string") {
        userWhere.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { profile: { summary: { contains: search, mode: "insensitive" } } },
          { profile: { skills: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (Object.keys(profileWhere).length > 0) {
        userWhere.profile = { ...(userWhere.profile || {}), ...profileWhere };
      }

      const candidates = await prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profile: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Only show candidates who have at least started a profile
      const withProfile = candidates.filter((c) => c.profile !== null);

      res.json({ candidates: withProfile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  }
);

// GET /api/candidates/filters — distinct skills & locations for filter dropdowns
router.get(
  "/filters",
  requireAuth,
  requireRole("RECRUITER"),
  async (req: Request, res: Response) => {
    try {
      const profiles = await prisma.profile.findMany({
        select: { skills: true, location: true },
      });

      const locationsSet = new Set<string>();
      const skillsSet = new Set<string>();

      profiles.forEach((p) => {
        if (p.location) locationsSet.add(p.location.trim());
        if (p.skills) {
          p.skills.split(",").forEach((s) => {
            const trimmed = s.trim();
            if (trimmed) skillsSet.add(trimmed);
          });
        }
      });

      res.json({
        locations: Array.from(locationsSet).sort(),
        skills: Array.from(skillsSet).sort(),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch filters" });
    }
  }
);

export default router;