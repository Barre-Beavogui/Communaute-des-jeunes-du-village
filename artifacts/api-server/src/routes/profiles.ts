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
import { requireCommunityAccess } from "../lib/community-access.js";
import { isValidAdminToken } from "../lib/admin-auth.js";
import { authorizationToken } from "../lib/member-auth.js";

const router: IRouter = Router();

export function toProfile(
  row: typeof profilesTable.$inferSelect,
  includePrivateDetails = false,
) {
  const phone = row.loginPhone ?? row.contact;
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    neighborhood: row.neighborhood,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    activities: row.activities ?? [],
    project: row.project,
    contact: includePrivateDetails || row.showPhone ? phone : null,
    email: includePrivateDetails || row.showEmail ? row.loginEmail : null,
    phone: includePrivateDetails || row.showPhone ? phone : null,
    instagram: null,
    gender: includePrivateDetails || row.showGender ? row.gender : null,
    maritalStatus:
      includePrivateDetails || row.showMaritalStatus ? row.maritalStatus : null,
    educationLevel:
      includePrivateDetails || row.showEducationLevel
        ? row.educationLevel
        : null,
    observations: includePrivateDetails ? row.observations : null,
    emergencyContactName: includePrivateDetails
      ? row.emergencyContactName
      : null,
    emergencyContactPhone: includePrivateDetails
      ? row.emergencyContactPhone
      : null,
    fatherFirstNames: includePrivateDetails ? row.fatherFirstNames : null,
    motherFullName: includePrivateDetails ? row.motherFullName : null,
    showEmail: row.showEmail,
    showPhone: row.showPhone,
    showGender: row.showGender,
    showMaritalStatus: row.showMaritalStatus,
    showEducationLevel: row.showEducationLevel,
    privacy: row.privacy as "community" | "private",
    status: row.status as "approved" | "pending",
  };
}

router.get("/profiles", requireCommunityAccess, async (req, res) => {
  const includePrivateDetails = isValidAdminToken(authorizationToken(req));
  if (includePrivateDetails) {
    res.setHeader("Cache-Control", "private, no-store");
  }
  const rows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.status, "approved"));
  res.json(
    ListProfilesResponse.parse(
      rows.map((row) => toProfile(row, includePrivateDetails)),
    ),
  );
});

router.get("/profiles/:id", requireCommunityAccess, async (req, res) => {
  const includePrivateDetails = isValidAdminToken(authorizationToken(req));
  if (includePrivateDetails) {
    res.setHeader("Cache-Control", "private, no-store");
  }
  const params = GetProfileParams.parse(req.params);
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, params.id));
  if (!row || row.status !== "approved") {
    res.status(404).json({ error: "Profil introuvable" });
    return;
  }
  res.json(GetProfileResponse.parse(toProfile(row, includePrivateDetails)));
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
