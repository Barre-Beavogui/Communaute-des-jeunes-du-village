import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import {
  GetProfileParams,
  GetProfileResponse,
  ListProfilesResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  GetMembersSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const currentMemberId = "mina";

function toProfile(row: typeof profilesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    age: row.age,
    neighborhood: row.neighborhood,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    activities: row.activities ?? [],
    project: row.project,
    contact: row.contact,
    instagram: row.instagram,
    privacy: row.privacy as "community" | "private",
    status: row.status as "approved" | "pending",
  };
}

router.get("/profiles", async (req, res) => {
  const rows = await db.select().from(profilesTable).where(eq(profilesTable.status, "approved"));
  res.json(ListProfilesResponse.parse(rows.map(toProfile)));
});

router.get("/profiles/:id", async (req, res) => {
  const params = GetProfileParams.parse(req.params);
  const [row] = await db.select().from(profilesTable).where(eq(profilesTable.id, params.id));
  if (!row || row.status !== "approved") {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }
  res.json(GetProfileResponse.parse(toProfile(row)));
});

router.patch("/profiles/me", async (req, res) => {
  const data = UpdateMyProfileBody.parse(req.body);
  const [row] = await db
    .update(profilesTable)
    .set({
      ...data,
      initials: data.name ? data.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : undefined,
    })
    .where(eq(profilesTable.id, currentMemberId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }
  res.json(UpdateMyProfileResponse.parse(toProfile(row)));
});

router.get("/members/summary", async (_req, res) => {
  const rows = await db.select().from(profilesTable).where(eq(profilesTable.status, "approved"));
  const counts = new Map<string, number>();
  rows.forEach((row) => (row.activities ?? []).forEach((activity) => counts.set(activity, (counts.get(activity) ?? 0) + 1)));
  const topActivities = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => ({ label, count }));
  res.json(GetMembersSummaryResponse.parse({
    totalMembers: rows.length,
    activeProjects: rows.filter((row) => row.project).length,
    topActivities,
  }));
});

export default router;