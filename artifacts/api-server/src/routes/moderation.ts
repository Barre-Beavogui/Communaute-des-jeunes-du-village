import { Router, type IRouter } from "express";
import { and, desc, eq, ne, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementDislikesTable,
  announcementLikesTable,
  chatMessagesTable,
  deletedProfilesTable,
  pollVotesTable,
  membershipRequestsTable,
  passwordResetRequestsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  CreatePasswordResetCodeParams,
  CreatePasswordResetCodeResponse,
  DeleteModerationProfileParams,
  GenerateMemberCodeBody,
  GenerateMemberCodeParams,
  GenerateMemberCodeResponse,
  ListModerationRequestsResponse,
  ListPasswordResetRequestsResponse,
  ReviewModerationRequestParams,
  ReviewModerationRequestBody,
  ReviewModerationRequestResponse,
  UpdateModerationProfileBody,
  UpdateModerationProfileParams,
  UpdateModerationProfileResponse,
  UpdateProfileVisibilityBody,
  UpdateProfileVisibilityParams,
  UpdateProfileVisibilityResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";
import {
  generateMemberCode,
  hashMemberCode,
  normalizeLoginEmail,
  normalizeLoginPhone,
} from "../lib/member-auth.js";
import { toProfile } from "./profiles.js";

const router: IRouter = Router();
const PROFILE_PHOTO_PATTERN = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

function toRequest(row: typeof membershipRequestsTable.$inferSelect) {
  return {
    ...row,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as "pending" | "approved" | "rejected",
  };
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "membre"
  );
}

router.use("/moderation", requireAdmin);

router.get("/moderation/requests", async (_req, res) => {
  const rows = await db
    .select()
    .from(membershipRequestsTable)
    .where(eq(membershipRequestsTable.status, "pending"));
  res.json(ListModerationRequestsResponse.parse(rows.map(toRequest)));
});

router.get("/moderation/password-reset-requests", async (_req, res) => {
  const rows = await db
    .select({
      id: passwordResetRequestsTable.id,
      profileId: passwordResetRequestsTable.profileId,
      memberName: profilesTable.name,
      email: profilesTable.loginEmail,
      phone: profilesTable.loginPhone,
      requestedAt: passwordResetRequestsTable.requestedAt,
    })
    .from(passwordResetRequestsTable)
    .innerJoin(
      profilesTable,
      eq(passwordResetRequestsTable.profileId, profilesTable.id),
    )
    .where(eq(passwordResetRequestsTable.status, "pending"))
    .orderBy(desc(passwordResetRequestsTable.requestedAt));

  res.json(
    ListPasswordResetRequestsResponse.parse(
      rows.map((row) => ({
        ...row,
        requestedAt: row.requestedAt.toISOString(),
      })),
    ),
  );
});

router.post(
  "/moderation/password-reset-requests/:id/code",
  async (req, res) => {
    const params = CreatePasswordResetCodeParams.parse(req.params);
    const result = await db.transaction(async (tx) => {
      const [resetRequest] = await tx
        .select()
        .from(passwordResetRequestsTable)
        .where(
          and(
            eq(passwordResetRequestsTable.id, params.id),
            eq(passwordResetRequestsTable.status, "pending"),
          ),
        );
      if (!resetRequest) return null;

      const [profile] = await tx
        .select()
        .from(profilesTable)
        .where(
          and(
            eq(profilesTable.id, resetRequest.profileId),
            eq(profilesTable.status, "approved"),
          ),
        );
      if (!profile) return null;

      const code = generateMemberCode();
      const createdAt = new Date();
      await tx
        .update(profilesTable)
        .set({
          memberCodeHash: hashMemberCode(code),
          memberCodeCreatedAt: createdAt,
          memberPasswordHash: null,
          memberPasswordSetAt: null,
        })
        .where(eq(profilesTable.id, profile.id));
      await tx
        .update(passwordResetRequestsTable)
        .set({ status: "completed" })
        .where(eq(passwordResetRequestsTable.id, resetRequest.id));

      return {
        code,
        createdAt: createdAt.toISOString(),
        memberName: profile.name,
        email: profile.loginEmail,
        phone: profile.loginPhone,
      };
    });

    if (!result) {
      res.status(404).json({ error: "Demande introuvable." });
      return;
    }
    res.json(CreatePasswordResetCodeResponse.parse(result));
  },
);

router.patch("/moderation/requests/:id", async (req, res) => {
  const params = ReviewModerationRequestParams.parse(req.params);
  const body = ReviewModerationRequestBody.parse(req.body);
  const result = await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(membershipRequestsTable)
      .where(eq(membershipRequestsTable.id, params.id));

    if (!request || request.status !== "pending") return null;

    let memberCode: string | null = null;
    if (body.status === "approved") {
      const normalizedEmail = normalizeLoginEmail(request.email);
      const normalizedPhone = request.phone
        ? normalizeLoginPhone(request.phone)
        : null;
      const identifierConditions = [
        eq(profilesTable.loginEmailNormalized, normalizedEmail),
      ];
      if (normalizedPhone) {
        identifierConditions.push(
          eq(profilesTable.loginPhoneNormalized, normalizedPhone),
        );
      }
      const [conflictingProfile] = await tx
        .select({ id: profilesTable.id })
        .from(profilesTable)
        .where(or(...identifierConditions))
        .limit(1);
      if (conflictingProfile) {
        return { conflict: true as const };
      }

      const profileId = `${slugify(request.name)}-${request.id.slice(0, 8)}`;
      memberCode = generateMemberCode();
      const codeCreatedAt = new Date();
      const initials = request.name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      await tx
        .insert(profilesTable)
        .values({
          id: profileId,
          name: request.name,
          initials,
          avatarUrl: request.avatarUrl,
          neighborhood: request.neighborhood,
          bio: request.bio || `Profession ou statut : ${request.profession}.`,
          activities: [request.profession],
          project: request.project,
          contact: request.phone,
          instagram: null,
          privacy: "private",
          status: "approved",
          memberCodeHash: hashMemberCode(memberCode),
          memberCodeCreatedAt: codeCreatedAt,
          memberPasswordHash: null,
          memberPasswordSetAt: null,
          loginEmail: request.email,
          loginEmailNormalized: normalizedEmail,
          loginPhone: request.phone,
          loginPhoneNormalized: normalizedPhone,
          gender: request.gender,
          maritalStatus: request.maritalStatus,
          educationLevel: request.educationLevel,
          observations: request.observations,
          emergencyContactName: request.emergencyContactName,
          emergencyContactPhone: request.emergencyContactPhone,
          fatherFirstNames: request.fatherFirstNames,
          motherFullName: request.motherFullName,
        })
        .onConflictDoNothing({ target: profilesTable.id });
    }

    const [updated] = await tx
      .update(membershipRequestsTable)
      .set({ status: body.status })
      .where(eq(membershipRequestsTable.id, params.id))
      .returning();
    return { conflict: false as const, request: updated, memberCode };
  });

  if (!result) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }
  if (result.conflict) {
    res.status(409).json({
      error: "Cet email ou ce téléphone appartient déjà à un autre membre.",
    });
    return;
  }
  res.json(
    ReviewModerationRequestResponse.parse({
      ...toRequest(result.request),
      memberCode: result.memberCode,
    }),
  );
});

router.patch("/moderation/profiles/:id/visibility", async (req, res) => {
  const params = UpdateProfileVisibilityParams.parse(req.params);
  const body = UpdateProfileVisibilityBody.parse(req.body);
  const [updated] = await db
    .update(profilesTable)
    .set({
      showGender: body.showGender,
      showMaritalStatus: body.showMaritalStatus,
      showEducationLevel: body.showEducationLevel,
    })
    .where(
      and(
        eq(profilesTable.id, params.id),
        eq(profilesTable.status, "approved"),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }
  res.json(UpdateProfileVisibilityResponse.parse(toProfile(updated, true)));
});

router.patch("/moderation/profiles/:id", async (req, res) => {
  const params = UpdateModerationProfileParams.parse(req.params);
  const body = UpdateModerationProfileBody.parse(req.body);
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
  if (body.avatarUrl && !PROFILE_PHOTO_PATTERN.test(body.avatarUrl)) {
    res.status(400).json({ error: "La photo de profil est invalide." });
    return;
  }
  const emergencyPhone = body.emergencyContactPhone?.trim() || null;
  if (emergencyPhone) {
    const normalizedEmergencyPhone = normalizeLoginPhone(emergencyPhone);
    if (!normalizedEmergencyPhone || normalizedEmergencyPhone.length < 6) {
      res
        .status(400)
        .json({ error: "Téléphone du contact d’urgence invalide." });
      return;
    }
  }

  const [emailConflict, phoneConflict] = await Promise.all([
    normalizedEmail
      ? db
          .select({ id: profilesTable.id })
          .from(profilesTable)
          .where(
            and(
              ne(profilesTable.id, params.id),
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
              ne(profilesTable.id, params.id),
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
      gender: body.gender || null,
      maritalStatus: body.maritalStatus || null,
      educationLevel: body.educationLevel || null,
      observations: body.observations?.trim() || null,
      emergencyContactName: body.emergencyContactName?.trim() || null,
      emergencyContactPhone: emergencyPhone,
      fatherFirstNames: body.fatherFirstNames?.trim() || null,
      motherFullName: body.motherFullName?.trim() || null,
      showGender: Boolean(body.gender && body.showGender),
      showMaritalStatus: Boolean(body.maritalStatus && body.showMaritalStatus),
      showEducationLevel: Boolean(
        body.educationLevel && body.showEducationLevel,
      ),
    })
    .where(
      and(
        eq(profilesTable.id, params.id),
        eq(profilesTable.status, "approved"),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }
  res.json(UpdateModerationProfileResponse.parse(toProfile(updated, true)));
});

router.delete("/moderation/profiles/:id", async (req, res) => {
  const params = DeleteModerationProfileParams.parse(req.params);
  const deleted = await db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(eq(profilesTable.id, params.id));

    if (!profile) return false;

    await tx
      .insert(deletedProfilesTable)
      .values({ id: profile.id })
      .onConflictDoNothing({ target: deletedProfilesTable.id });
    await tx
      .delete(announcementLikesTable)
      .where(eq(announcementLikesTable.profileId, profile.id));
    await tx
      .delete(announcementDislikesTable)
      .where(eq(announcementDislikesTable.profileId, profile.id));
    await tx
      .delete(pollVotesTable)
      .where(eq(pollVotesTable.profileId, profile.id));
    await tx
      .delete(passwordResetRequestsTable)
      .where(eq(passwordResetRequestsTable.profileId, profile.id));
    await tx
      .delete(chatMessagesTable)
      .where(eq(chatMessagesTable.profileId, profile.id));
    await tx.delete(profilesTable).where(eq(profilesTable.id, profile.id));
    return true;
  });

  if (!deleted) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }

  res.status(204).send();
});

router.post("/moderation/profiles/:id/member-code", async (req, res) => {
  const params = GenerateMemberCodeParams.parse(req.params);
  const body = GenerateMemberCodeBody.parse(req.body);
  const email = body.email?.trim() || null;
  const phone = body.phone?.trim() || null;
  const normalizedPhone = phone ? normalizeLoginPhone(phone) : null;
  if (
    (!email || !email.includes("@")) &&
    (!normalizedPhone || normalizedPhone.length < 6)
  ) {
    res.status(400).json({
      error: "Ajoutez une adresse email ou un numéro de téléphone valide.",
    });
    return;
  }
  const code = generateMemberCode();
  const createdAt = new Date();
  const [updated] = await db
    .update(profilesTable)
    .set({
      memberCodeHash: hashMemberCode(code),
      memberCodeCreatedAt: createdAt,
      memberPasswordHash: null,
      memberPasswordSetAt: null,
      ...(email
        ? {
            loginEmail: email,
            loginEmailNormalized: normalizeLoginEmail(email),
          }
        : {}),
      ...(phone
        ? {
            loginPhone: phone,
            loginPhoneNormalized: normalizedPhone,
          }
        : {}),
    })
    .where(eq(profilesTable.id, params.id))
    .returning({ id: profilesTable.id });

  if (!updated) {
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }

  res.json(
    GenerateMemberCodeResponse.parse({
      code,
      createdAt: createdAt.toISOString(),
    }),
  );
});

export default router;
