import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementDislikesTable,
  announcementLikesTable,
  deletedProfilesTable,
  pollVotesTable,
  membershipRequestsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  DeleteModerationProfileParams,
  GenerateMemberCodeBody,
  GenerateMemberCodeParams,
  GenerateMemberCodeResponse,
  ListModerationRequestsResponse,
  ReviewModerationRequestParams,
  ReviewModerationRequestBody,
  ReviewModerationRequestResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";
import {
  generateMemberCode,
  hashMemberCode,
  normalizeLoginEmail,
  normalizeLoginPhone,
} from "../lib/member-auth";

const router: IRouter = Router();

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
          loginEmailNormalized: normalizeLoginEmail(request.email),
          loginPhone: request.phone,
          loginPhoneNormalized: request.phone
            ? normalizeLoginPhone(request.phone)
            : null,
        })
        .onConflictDoNothing({ target: profilesTable.id });
    }

    const [updated] = await tx
      .update(membershipRequestsTable)
      .set({ status: body.status })
      .where(eq(membershipRequestsTable.id, params.id))
      .returning();
    return { request: updated, memberCode };
  });

  if (!result) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }
  res.json(
    ReviewModerationRequestResponse.parse({
      ...toRequest(result.request),
      memberCode: result.memberCode,
    }),
  );
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
