import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { membershipRequestsTable } from "@workspace/db/schema";
import {
  CreateMembershipRequestBody,
  CreateMembershipRequestResponse,
} from "@workspace/api-zod";
import { normalizeLoginPhone } from "../lib/member-auth";

const router: IRouter = Router();
const submissions = new Map<string, { count: number; resetAt: number }>();
const SUBMISSION_LIMIT = 5;
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const PROFILE_PHOTO_PATTERN = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

router.post("/membership-requests", async (req, res) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = submissions.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + SUBMISSION_WINDOW_MS }
      : current;

  if (entry.count >= SUBMISSION_LIMIT) {
    res.status(429).json({
      error: "Trop de demandes ont été envoyées. Réessayez plus tard.",
    });
    return;
  }

  const data = CreateMembershipRequestBody.parse(req.body);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }
  const normalizedPhone = data.phone ? normalizeLoginPhone(data.phone) : null;
  if (data.phone && (!normalizedPhone || normalizedPhone.length < 6)) {
    res.status(400).json({ error: "Numéro de téléphone invalide." });
    return;
  }
  if (data.avatarUrl && !PROFILE_PHOTO_PATTERN.test(data.avatarUrl)) {
    res.status(400).json({ error: "La photo de profil est invalide." });
    return;
  }
  const normalizedEmail = data.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: membershipRequestsTable.id })
    .from(membershipRequestsTable)
    .where(
      and(
        eq(membershipRequestsTable.email, normalizedEmail),
        eq(membershipRequestsTable.status, "pending"),
      ),
    );
  if (existing) {
    res.status(409).json({
      error: "Une demande avec cette adresse email attend déjà une validation.",
    });
    return;
  }

  const id = randomUUID();
  const [row] = await db
    .insert(membershipRequestsTable)
    .values({
      id,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || null,
      avatarUrl: data.avatarUrl || null,
      neighborhood: data.neighborhood.trim(),
      profession: data.profession.trim(),
      bio: data.bio.trim(),
      project: data.project?.trim() || null,
      status: "pending",
    })
    .returning();

  submissions.set(key, { ...entry, count: entry.count + 1 });

  res.status(201).json(
    CreateMembershipRequestResponse.parse({
      id: row.id,
      submittedAt: row.submittedAt.toISOString(),
      status: "pending",
    }),
  );
});

export default router;
