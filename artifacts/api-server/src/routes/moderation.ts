import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { membershipRequestsTable, profilesTable } from "@workspace/db/schema";
import {
  ListModerationRequestsResponse,
  ReviewModerationRequestParams,
  ReviewModerationRequestBody,
  ReviewModerationRequestResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";

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

export default router;
