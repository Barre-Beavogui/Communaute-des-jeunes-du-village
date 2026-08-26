import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  passwordResetRequestsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  GetMemberProfileSettingsResponse,
  MemberActivateBody,
  MemberActivateResponse,
  MemberLoginBody,
  MemberLoginResponse,
  RequestMemberPasswordResetBody,
  RequestMemberPasswordResetResponse,
  SetMemberPasswordBody,
  SetMemberPasswordResponse,
  UpdateMemberProfileBody,
  UpdateMemberProfileResponse,
} from "@workspace/api-zod";
import {
  createMemberSetupSession,
  createMemberSession,
  hashMemberCode,
  hashMemberPassword,
  memberAuthIsConfigured,
  normalizeLoginEmail,
  normalizeLoginPhone,
  requireMember,
  requireMemberSetup,
  verifyMemberPassword,
} from "../lib/member-auth";

const router: IRouter = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const resetRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_RESET_REQUESTS = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const PROFILE_PHOTO_PATTERN = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

function attemptEntry(req: Request) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + WINDOW_MS }
      : current;
  return { key, entry };
}

function profileSettings(row: typeof profilesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    avatarUrl: row.avatarUrl,
    neighborhood: row.neighborhood,
    bio: row.bio,
    profession: row.activities?.[0] ?? "Autre",
    project: row.project,
    email: row.loginEmail,
    phone: row.loginPhone ?? row.contact,
    showEmail: row.showEmail,
    showPhone: row.showPhone,
  };
}

router.post("/member/activate", async (req, res) => {
  if (!memberAuthIsConfigured()) {
    res
      .status(503)
      .json({ error: "L’espace membre n’est pas encore configuré." });
    return;
  }
  const { key, entry } = attemptEntry(req);
  if (entry.count >= MAX_ATTEMPTS) {
    res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
    return;
  }

  const body = MemberActivateBody.parse(req.body);
  const [profile] = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
      memberPasswordHash: profilesTable.memberPasswordHash,
      loginEmailNormalized: profilesTable.loginEmailNormalized,
      loginPhoneNormalized: profilesTable.loginPhoneNormalized,
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
    res.status(401).json({ error: "Code de première connexion incorrect." });
    return;
  }
  if (profile.memberPasswordHash) {
    res.status(409).json({
      error:
        "Ce compte est déjà activé. Connectez-vous avec votre email ou téléphone.",
    });
    return;
  }
  if (!profile.loginEmailNormalized && !profile.loginPhoneNormalized) {
    res.status(409).json({
      error:
        "L’administrateur doit ajouter un email ou un téléphone à ce compte.",
    });
    return;
  }

  attempts.delete(key);
  const session = createMemberSetupSession(profile.id);
  res.json(
    MemberActivateResponse.parse({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      requiresPasswordChange: true,
      profile: {
        id: profile.id,
        name: profile.name,
        initials: profile.initials,
        avatarUrl: profile.avatarUrl,
      },
    }),
  );
});

router.post("/member/login", async (req, res) => {
  if (!memberAuthIsConfigured()) {
    res
      .status(503)
      .json({ error: "L’espace membre n’est pas encore configuré." });
    return;
  }
  const { key, entry } = attemptEntry(req);
  if (entry.count >= MAX_ATTEMPTS) {
    res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
    return;
  }

  const body = MemberLoginBody.parse(req.body);
  const identifier = body.identifier.trim();
  const isEmail = identifier.includes("@");
  const normalizedIdentifier = isEmail
    ? normalizeLoginEmail(identifier)
    : normalizeLoginPhone(identifier);
  const rows = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
      memberPasswordHash: profilesTable.memberPasswordHash,
    })
    .from(profilesTable)
    .where(
      and(
        isEmail
          ? eq(profilesTable.loginEmailNormalized, normalizedIdentifier)
          : eq(profilesTable.loginPhoneNormalized, normalizedIdentifier),
        eq(profilesTable.status, "approved"),
      ),
    );
  const profile = rows.length === 1 ? rows[0] : null;

  if (
    !profile?.memberPasswordHash ||
    !(await verifyMemberPassword(body.password, profile.memberPasswordHash))
  ) {
    attempts.set(key, { ...entry, count: entry.count + 1 });
    res
      .status(401)
      .json({ error: "Email, téléphone ou mot de passe incorrect." });
    return;
  }

  attempts.delete(key);
  const session = createMemberSession(profile.id);
  res.json(
    MemberLoginResponse.parse({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      requiresPasswordChange: false,
      profile: {
        id: profile.id,
        name: profile.name,
        initials: profile.initials,
        avatarUrl: profile.avatarUrl,
      },
    }),
  );
});

router.post("/member/password-reset-requests", async (req, res) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = resetRequests.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + RESET_WINDOW_MS }
      : current;

  if (entry.count >= MAX_RESET_REQUESTS) {
    res.status(429).json({ error: "Trop de demandes. Réessayez plus tard." });
    return;
  }

  resetRequests.set(key, { ...entry, count: entry.count + 1 });
  const body = RequestMemberPasswordResetBody.parse(req.body);
  const identifier = body.identifier.trim();
  const isEmail = identifier.includes("@");
  const normalizedIdentifier = isEmail
    ? normalizeLoginEmail(identifier)
    : normalizeLoginPhone(identifier);
  const rows = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(
      and(
        isEmail
          ? eq(profilesTable.loginEmailNormalized, normalizedIdentifier)
          : eq(profilesTable.loginPhoneNormalized, normalizedIdentifier),
        eq(profilesTable.status, "approved"),
      ),
    );

  if (rows.length === 1) {
    await db.transaction(async (tx) => {
      await tx
        .delete(passwordResetRequestsTable)
        .where(
          and(
            eq(passwordResetRequestsTable.profileId, rows[0]!.id),
            eq(passwordResetRequestsTable.status, "pending"),
          ),
        );
      await tx.insert(passwordResetRequestsTable).values({
        id: randomUUID(),
        profileId: rows[0]!.id,
      });
    });
  }

  res
    .status(202)
    .json(RequestMemberPasswordResetResponse.parse({ success: true }));
});

router.get("/member/profile", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.id, profileId),
        eq(profilesTable.status, "approved"),
      ),
    );

  if (!profile) {
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }
  res.json(GetMemberProfileSettingsResponse.parse(profileSettings(profile)));
});

router.patch("/member/profile", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const body = UpdateMemberProfileBody.parse(req.body);
  const email = body.email?.trim() || null;
  const phone = body.phone?.trim() || null;
  const normalizedEmail = email ? normalizeLoginEmail(email) : null;
  const normalizedPhone = phone ? normalizeLoginPhone(phone) : null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }
  if (phone && (!normalizedPhone || normalizedPhone.length < 6)) {
    res.status(400).json({ error: "Numéro de téléphone invalide." });
    return;
  }
  if (!normalizedEmail && !normalizedPhone) {
    res.status(400).json({
      error: "Conservez au moins un email ou un téléphone de connexion.",
    });
    return;
  }
  if (body.avatarUrl && !PROFILE_PHOTO_PATTERN.test(body.avatarUrl)) {
    res.status(400).json({ error: "La photo de profil est invalide." });
    return;
  }

  const [emailConflict, phoneConflict] = await Promise.all([
    normalizedEmail
      ? db
          .select({ id: profilesTable.id })
          .from(profilesTable)
          .where(
            and(
              ne(profilesTable.id, profileId),
              eq(profilesTable.loginEmailNormalized, normalizedEmail),
            ),
          )
      : Promise.resolve([]),
    normalizedPhone
      ? db
          .select({ id: profilesTable.id })
          .from(profilesTable)
          .where(
            and(
              ne(profilesTable.id, profileId),
              eq(profilesTable.loginPhoneNormalized, normalizedPhone),
            ),
          )
      : Promise.resolve([]),
  ]);
  if (emailConflict.length || phoneConflict.length) {
    res.status(409).json({
      error: "Cet email ou ce téléphone est déjà utilisé par un autre compte.",
    });
    return;
  }

  const name = body.name.trim();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [updated] = await db
    .update(profilesTable)
    .set({
      name,
      initials,
      avatarUrl: body.avatarUrl || null,
      neighborhood: body.neighborhood.trim(),
      bio: body.bio.trim(),
      activities: [body.profession.trim()],
      project: body.project?.trim() || null,
      contact: phone,
      loginEmail: email,
      loginEmailNormalized: normalizedEmail,
      loginPhone: phone,
      loginPhoneNormalized: normalizedPhone,
      showEmail: Boolean(email && body.showEmail),
      showPhone: Boolean(phone && body.showPhone),
    })
    .where(
      and(
        eq(profilesTable.id, profileId),
        eq(profilesTable.status, "approved"),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }
  res.json(UpdateMemberProfileResponse.parse(profileSettings(updated)));
});

router.post("/member/set-password", requireMemberSetup, async (req, res) => {
  const body = SetMemberPasswordBody.parse(req.body);
  const profileId = res.locals["memberProfileId"] as string;
  const passwordHash = await hashMemberPassword(body.password);
  const [updated] = await db
    .update(profilesTable)
    .set({
      memberPasswordHash: passwordHash,
      memberPasswordSetAt: new Date(),
    })
    .where(
      and(
        eq(profilesTable.id, profileId),
        isNull(profilesTable.memberPasswordHash),
      ),
    )
    .returning({ id: profilesTable.id });

  if (!updated) {
    res.status(409).json({ error: "Le mot de passe a déjà été créé." });
    return;
  }

  res.json(SetMemberPasswordResponse.parse({ success: true }));
});

export default router;
