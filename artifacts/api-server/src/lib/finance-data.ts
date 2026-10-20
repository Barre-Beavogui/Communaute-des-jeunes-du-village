import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  communityRolesTable,
  financeContributionsTable,
  financeMonthsTable,
  profileRolesTable,
  profilesTable,
} from "@workspace/db/schema";
import { FINANCE_PERMISSION, memberHasPermission } from "./role-data.js";

export const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function loadFinanceDashboard(
  monthKey: string,
  options?: { viewerProfileId?: string | null; admin?: boolean },
) {
  const [profiles, monthRows, contributions, managerRows] = await Promise.all([
    db
      .select({
        id: profilesTable.id,
        name: profilesTable.name,
        initials: profilesTable.initials,
        avatarUrl: profilesTable.avatarUrl,
        neighborhood: profilesTable.neighborhood,
      })
      .from(profilesTable)
      .where(eq(profilesTable.status, "approved")),
    db
      .select()
      .from(financeMonthsTable)
      .where(eq(financeMonthsTable.monthKey, monthKey)),
    db
      .select()
      .from(financeContributionsTable)
      .where(eq(financeContributionsTable.monthKey, monthKey)),
    db
      .select({
        profileId: profilesTable.id,
        memberName: profilesTable.name,
        initials: profilesTable.initials,
        avatarUrl: profilesTable.avatarUrl,
        roleName: communityRolesTable.name,
      })
      .from(profileRolesTable)
      .innerJoin(
        communityRolesTable,
        eq(profileRolesTable.roleId, communityRolesTable.id),
      )
      .innerJoin(
        profilesTable,
        eq(profileRolesTable.profileId, profilesTable.id),
      )
      .where(
        sql`${communityRolesTable.permissions} @> ARRAY[${FINANCE_PERMISSION}]::text[]`,
      ),
  ]);
  const month = monthRows[0];
  const targetAmount = month?.targetAmount ?? 0;
  const expectedPerMember = month?.expectedPerMember ?? 0;
  const contributionByProfile = new Map(
    contributions.map((item) => [item.profileId, item]),
  );
  const members = profiles
    .sort((left, right) => left.name.localeCompare(right.name, "fr"))
    .map((profile) => {
      const contribution = contributionByProfile.get(profile.id);
      const amount = contribution?.amount ?? 0;
      const status =
        expectedPerMember > 0 && amount >= expectedPerMember
          ? "paid"
          : amount > 0
            ? "partial"
            : "pending";
      return {
        profileId: profile.id,
        memberName: profile.name,
        initials: profile.initials,
        avatarUrl: profile.avatarUrl,
        neighborhood: profile.neighborhood,
        amount,
        note: contribution?.note ?? null,
        updatedAt: contribution?.updatedAt.toISOString() ?? null,
        status,
      };
    });
  const totalCollected = members.reduce(
    (total, item) => total + item.amount,
    0,
  );
  const canManage =
    Boolean(options?.admin) ||
    (options?.viewerProfileId
      ? await memberHasPermission(options.viewerProfileId, FINANCE_PERMISSION)
      : false);
  return {
    monthKey,
    targetAmount,
    expectedPerMember,
    currency: month?.currency ?? "GNF",
    totalCollected,
    remainingAmount: Math.max(0, targetAmount - totalCollected),
    contributorCount: members.filter((item) => item.amount > 0).length,
    memberCount: members.length,
    canManage,
    managers: managerRows.map((manager) => ({
      profileId: manager.profileId,
      memberName: manager.memberName,
      initials: manager.initials,
      avatarUrl: manager.avatarUrl,
      roleName: manager.roleName,
    })),
    members,
    updatedAt: month?.updatedAt.toISOString() ?? null,
  };
}

export async function upsertFinanceMonth(
  monthKey: string,
  input: { targetAmount: number; expectedPerMember: number },
  updatedBy: string,
) {
  await db
    .insert(financeMonthsTable)
    .values({
      monthKey,
      targetAmount: input.targetAmount,
      expectedPerMember: input.expectedPerMember,
      updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeMonthsTable.monthKey,
      set: {
        targetAmount: input.targetAmount,
        expectedPerMember: input.expectedPerMember,
        updatedBy,
        updatedAt: new Date(),
      },
    });
}

export async function upsertFinanceContribution(
  monthKey: string,
  profileId: string,
  input: { amount: number; note?: string | null },
  updatedBy: string,
) {
  await db
    .insert(financeContributionsTable)
    .values({
      monthKey,
      profileId,
      amount: input.amount,
      note: input.note?.trim() || null,
      updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        financeContributionsTable.monthKey,
        financeContributionsTable.profileId,
      ],
      set: {
        amount: input.amount,
        note: input.note?.trim() || null,
        updatedBy,
        updatedAt: new Date(),
      },
    });
}
