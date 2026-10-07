import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import prisma from "../prismaClient";
import { isValidEmail } from "../utils/email";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const validEmail = await isValidEmail(email);
    if (!validEmail) {
      return res.status(400).json({ error: "Please enter a valid, real email address" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER",
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong during registration" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong during login" });
  }
});

// POST /api/auth/google
// Body: { credential: <Google ID token>, role?: "JOB_SEEKER" | "RECRUITER" }
// Existing user -> logs in. New user without a role -> { needsRole: true }.
router.post("/google", async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: "Google sign-in is not configured" });
    }

    const { credential, role } = req.body;
    if (typeof credential !== "string" || !credential) {
      return res.status(400).json({ error: "Missing Google credential" });
    }

    // Verify the token's signature and that it was issued for this app
    let payload: TokenPayload | undefined;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Google sign-in failed. Please try again." });
    }

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: "Your Google email is not verified" });
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split("@")[0] || "User";

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    let created = false;

    if (!user) {
      if (role !== "JOB_SEEKER" && role !== "RECRUITER") {
        return res.json({ needsRole: true, name: displayName, email });
      }
      // Google users have no password: store an unguessable random hash
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      user = await prisma.user.create({
        data: { name: displayName, email, password: randomPassword, role },
      });
      created = true;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(created ? 201 : 200).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong during Google sign-in" });
  }
});

// Password reset (forgot-password / reset-password) lives in routes/passwordReset.ts

export default router;