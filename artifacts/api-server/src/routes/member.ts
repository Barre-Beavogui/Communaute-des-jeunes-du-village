import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { MemberLoginBody, MemberLoginResponse } from "@workspace/api-zod";
import {
  createMemberSession,
  hashMemberCode,
  memberAuthIsConfigured,
} from "../lib/member-auth";

const router: IRouter = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

router.post("/member/login", async (req, res) => {
  if (!memberAuthIsConfigured()) {
    res
      .status(503)
      .json({ error: "L’espace membre n’est pas encore configuré." });
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
    res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
    return;
  }

  const body = MemberLoginBody.parse(req.body);
  const [profile] = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.memberCodeHash, hashMemberCode(body.code)),
        eq(profilesTable.status, "approved"),
      ),
    );

  if (!profile) {
    attempts.set(key, { ...entry, count: entry.count + 1 });
    res.status(401).json({ error: "Code membre incorrect." });
    return;
  }

  attempts.delete(key);
  const session = createMemberSession(profile.id);
  res.json(
    MemberLoginResponse.parse({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      profile,
    }),
  );
});

export default router;
