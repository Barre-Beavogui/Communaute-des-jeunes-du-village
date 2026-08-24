import { Router, type IRouter } from "express";
import { AdminLoginBody, AdminLoginResponse } from "@workspace/api-zod";
import {
  adminIsConfigured,
  createAdminSession,
  passwordMatches,
} from "../lib/admin-auth";

const router: IRouter = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

router.post("/admin/login", (req, res) => {
  if (!adminIsConfigured()) {
    res
      .status(503)
      .json({ error: "L’espace administrateur n’est pas encore configuré." });
    return;
  }

  const key = req.ip || "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + WINDOW_MS }
      : current;

  if (entry.count >= MAX_ATTEMPTS) {
    res
      .status(429)
      .json({ error: "Trop de tentatives. Réessayez dans quelques minutes." });
    return;
  }

  const body = AdminLoginBody.parse(req.body);
  if (!passwordMatches(body.password)) {
    attempts.set(key, { ...entry, count: entry.count + 1 });
    res.status(401).json({ error: "Mot de passe incorrect." });
    return;
  }

  attempts.delete(key);
  const session = createAdminSession();
  res.json(
    AdminLoginResponse.parse({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    }),
  );
});

export default router;
