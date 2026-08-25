import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementLikesTable,
  deletedProfilesTable,
  pollVotesTable,
  membershipRequestsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  DeleteModerationProfileParams,
  GenerateMemberCodeParams,
  GenerateMemberCodeResponse,
  ListModerationRequestsResponse,
  ReviewModerationRequestParams,
  ReviewModerationRequestBody,
  ReviewModerationRequestResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";
import { generateMemberCode, hashMemberCode } from "../lib/member-auth";

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
  const row = await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(membershipRequestsTable)
      .where(eq(membershipRequestsTable.id, params.id));

    if (!request || request.status !== "pending") return null;

    if (body.status === "approved") {
      const profileId = `${slugify(request.name)}-${request.id.slice(0, 8)}`;
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
        })
        .onConflictDoNothing({ target: profilesTable.id });
    }

    const [updated] = await tx
      .update(membershipRequestsTable)
      .set({ status: body.status })
      .where(eq(membershipRequestsTable.id, params.id))
      .returning();
    return updated;
  });

  if (!row) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }
  res.json(ReviewModerationRequestResponse.parse(toRequest(row)));
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
  const code = generateMemberCode();
  const createdAt = new Date();
  const [updated] = await db
    .update(profilesTable)
    .set({
      memberCodeHash: hashMemberCode(code),
      memberCodeCreatedAt: createdAt,
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
