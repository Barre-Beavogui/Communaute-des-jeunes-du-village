import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import {
  GetProfileParams,
  GetProfileResponse,
  ListProfilesResponse,
  GetMembersSummaryResponse,
} from "@workspace/api-zod";
import { requireCommunityAccess } from "../lib/community-access";

const router: IRouter = Router();

function toProfile(row: typeof profilesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    neighborhood: row.neighborhood,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    activities: row.activities ?? [],
    project: row.project,
    contact: row.loginPhone ?? row.contact,
    email: row.loginEmail,
    phone: row.loginPhone ?? row.contact,
    instagram: null,
    privacy: row.privacy as "community" | "private",
    status: row.status as "approved" | "pending",
  };
}

router.get("/profiles", requireCommunityAccess, async (_req, res) => {
  const rows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.status, "approved"));
  res.json(ListProfilesResponse.parse(rows.map(toProfile)));
});

router.get("/profiles/:id", requireCommunityAccess, async (req, res) => {
  const params = GetProfileParams.parse(req.params);
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, params.id));
  if (!row || row.status !== "approved") {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }
  res.json(GetProfileResponse.parse(toProfile(row)));
});

router.get("/members/summary", requireCommunityAccess, async (_req, res) => {
  const rows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.status, "approved"));
  const counts = new Map<string, number>();
  rows.forEach((row) =>
    (row.activities ?? []).forEach((activity) =>
      counts.set(activity, (counts.get(activity) ?? 0) + 1),
    ),
  );
  const topActivities = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
  res.json(
    GetMembersSummaryResponse.parse({
      totalMembers: rows.length,
      activeProjects: rows.filter((row) => row.project).length,
      topActivities,
    }),
  );
});

export default router;
