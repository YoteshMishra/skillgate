import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import prisma from "../prismaClient";
import { sendResetEmail } from "../services/mailer";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

router.post("/forgot-password", limiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Enter a valid email." });
  }

  // Case-insensitive lookup, because register stores the email exactly as typed
  const user = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email.trim(), mode: "insensitive" } },
  });
  console.log("Reset requested for", parsed.data.email, "| user found:", !!user);

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    sendResetEmail(user.email, link)
      .then(() => console.log("Reset email sent to", user.email))
      .catch((err) => console.error("Reset email FAILED:", err));
  }

  // Same response either way
  res.json({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

router.post("/reset-password", limiter, async (req, res) => {
  const parsed = z
    .object({ token: z.string().min(10), password: z.string().min(8) })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(parsed.data.token) },
  });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ success: false, error: "This reset link is invalid or has expired." });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  res.json({ success: true, message: "Password updated. You can log in now." });
});

export default router;