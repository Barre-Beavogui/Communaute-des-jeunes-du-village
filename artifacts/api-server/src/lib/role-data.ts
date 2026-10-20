import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  communityRolesTable,
  profileRolesTable,
  profilesTable,
} from "@workspace/db/schema";

export const FINANCE_PERMISSION = "finance.manage";

export async function loadProfileRoleMap(profileIds: string[]) {
  if (!profileIds.length) return new Map<string, PublicRole[]>();
  const rows = await db
    .select({
      profileId: profileRolesTable.profileId,
      id: communityRolesTable.id,
      name: communityRolesTable.name,
      description: communityRolesTable.description,
    })
    .from(profileRolesTable)
    .innerJoin(
      communityRolesTable,
      eq(profileRolesTable.roleId, communityRolesTable.id),
    )
    .where(inArray(profileRolesTable.profileId, profileIds));
  const byProfile = new Map<string, PublicRole[]>();
  for (const row of rows) {
    const roles = byProfile.get(row.profileId) ?? [];
    roles.push({ id: row.id, name: row.name, description: row.description });
    byProfile.set(row.profileId, roles);
  }
  return byProfile;
}

export async function memberHasPermission(
  profileId: string,
  permission: string,
) {
  const [role] = await db
    .select({ id: communityRolesTable.id })
    .from(profileRolesTable)
    .innerJoin(
      communityRolesTable,
      eq(profileRolesTable.roleId, communityRolesTable.id),
    )
    .where(
      sql`${profileRolesTable.profileId} = ${profileId} AND ${communityRolesTable.permissions} @> ARRAY[${permission}]::text[]`,
    )
    .limit(1);
  return Boolean(role);
}

export async function loadRolesWithAssignments() {
  const [roles, assignments] = await Promise.all([
    db.select().from(communityRolesTable),
    db
      .select({
        roleId: profileRolesTable.roleId,
        profileId: profilesTable.id,
        memberName: profilesTable.name,
        initials: profilesTable.initials,
        avatarUrl: profilesTable.avatarUrl,
      })
      .from(profileRolesTable)
      .innerJoin(
        profilesTable,
        eq(profileRolesTable.profileId, profilesTable.id),
      ),
  ]);
  return roles
    .sort((left, right) => left.name.localeCompare(right.name, "fr"))
    .map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions ?? [],
      createdAt: role.createdAt.toISOString(),
      assignments: assignments
        .filter((assignment) => assignment.roleId === role.id)
        .map(({ roleId: _roleId, ...assignment }) => assignment),
    }));
}

type PublicRole = {
  id: string;
  name: string;
  description: string | null;
};
