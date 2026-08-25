import { Router, type IRouter, type Request } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import {
  MemberActivateBody,
  MemberActivateResponse,
  MemberLoginBody,
  MemberLoginResponse,
  SetMemberPasswordBody,
  SetMemberPasswordResponse,
} from "@workspace/api-zod";
import {
  createMemberSetupSession,
  createMemberSession,
  hashMemberCode,
  hashMemberPassword,
  memberAuthIsConfigured,
  normalizeLoginEmail,
  normalizeLoginPhone,
  requireMemberSetup,
  verifyMemberPassword,
} from "../lib/member-auth";

const router: IRouter = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

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
