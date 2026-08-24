import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { membershipRequestsTable } from "@workspace/db/schema";
import {
  ListModerationRequestsResponse,
  ReviewModerationRequestParams,
  ReviewModerationRequestBody,
  ReviewModerationRequestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/moderation/requests", async (_req, res) => {
  const rows = await db.select().from(membershipRequestsTable).where(eq(membershipRequestsTable.status, "pending"));
  res.json(ListModerationRequestsResponse.parse(rows.map((row) => ({
    ...row,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as "pending" | "approved" | "rejected",
  }))));
});

router.patch("/moderation/requests/:id", async (req, res) => {
  const params = ReviewModerationRequestParams.parse(req.params);
  const body = ReviewModerationRequestBody.parse(req.body);
  const [row] = await db.update(membershipRequestsTable).set({ status: body.status }).where(eq(membershipRequestsTable.id, params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }
  res.json(ReviewModerationRequestResponse.parse({
    ...row,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as "pending" | "approved" | "rejected",
  }));
});

export default router;