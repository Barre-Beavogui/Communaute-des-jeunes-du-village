import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  communityRolesTable,
  profileRolesTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  AssignRoleBody,
  AssignRoleParams,
  AssignRoleResponse,
  CreateRoleBody,
  CreateRoleResponse,
  DeleteRoleParams,
  ListRolesResponse,
  RemoveRoleAssignmentParams,
  UpdateRoleBody,
  UpdateRoleParams,
  UpdateRoleResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";
import { loadRolesWithAssignments } from "../lib/role-data.js";

const router: IRouter = Router();
router.use("/moderation/roles", requireAdmin);

async function roleWithAssignments(id: string) {
  return (await loadRolesWithAssignments()).find((role) => role.id === id);
}

router.get("/moderation/roles", async (_req, res) => {
  res.json(ListRolesResponse.parse(await loadRolesWithAssignments()));
});

router.post("/moderation/roles", async (req, res) => {
  const body = CreateRoleBody.parse(req.body);
  const [duplicate] = await db
    .select({ id: communityRolesTable.id })
    .from(communityRolesTable)
    .where(
      sql`lower(${communityRolesTable.name}) = lower(${body.name.trim()})`,
    );
  if (duplicate) {
    res.status(409).json({ error: "Un rôle porte déjà ce nom." });
    return;
  }
  const id = randomUUID();
  await db.insert(communityRolesTable).values({
    id,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    permissions: body.permissions,
  });
  res.status(201).json(CreateRoleResponse.parse(await roleWithAssignments(id)));
});

router.patch("/moderation/roles/:id", async (req, res) => {
  const params = UpdateRoleParams.parse(req.params);
  const body = UpdateRoleBody.parse(req.body);
  const [duplicate] = await db
    .select({ id: communityRolesTable.id })
    .from(communityRolesTable)
    .where(
      sql`${communityRolesTable.id} <> ${params.id} AND lower(${communityRolesTable.name}) = lower(${body.name.trim()})`,
    );
  if (duplicate) {
    res.status(409).json({ error: "Un rôle porte déjà ce nom." });
    return;
  }
  const [updated] = await db
    .update(communityRolesTable)
    .set({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      permissions: body.permissions,
    })
    .where(eq(communityRolesTable.id, params.id))
    .returning({ id: communityRolesTable.id });
  if (!updated) {
    res.status(404).json({ error: "Rôle introuvable." });
    return;
  }
  res.json(UpdateRoleResponse.parse(await roleWithAssignments(params.id)));
});

router.delete("/moderation/roles/:id", async (req, res) => {
  const params = DeleteRoleParams.parse(req.params);
  const removed = await db.transaction(async (tx) => {
    await tx
      .delete(profileRolesTable)
      .where(eq(profileRolesTable.roleId, params.id));
    const [role] = await tx
      .delete(communityRolesTable)
      .where(eq(communityRolesTable.id, params.id))
      .returning({ id: communityRolesTable.id });
    return role;
  });
  if (!removed) {
    res.status(404).json({ error: "Rôle introuvable." });
    return;
  }
  res.status(204).send();
});

router.post("/moderation/roles/:id/assignments", async (req, res) => {
  const params = AssignRoleParams.parse(req.params);
  const body = AssignRoleBody.parse(req.body);
  const [role, profile] = await Promise.all([
    db
      .select({ id: communityRolesTable.id })
      .from(communityRolesTable)
      .where(eq(communityRolesTable.id, params.id)),
    db
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(
        and(
          eq(profilesTable.id, body.profileId),
          eq(profilesTable.status, "approved"),
        ),
      ),
  ]);
  if (!role[0] || !profile[0]) {
    res.status(404).json({ error: "Rôle ou membre introuvable." });
    return;
  }
  await db
    .insert(profileRolesTable)
    .values({ roleId: params.id, profileId: body.profileId })
    .onConflictDoNothing();
  res.json(AssignRoleResponse.parse(await roleWithAssignments(params.id)));
});

router.delete(
  "/moderation/roles/:id/assignments/:profileId",
  async (req, res) => {
    const params = RemoveRoleAssignmentParams.parse(req.params);
    await db
      .delete(profileRolesTable)
      .where(
        and(
          eq(profileRolesTable.roleId, params.id),
          eq(profileRolesTable.profileId, params.profileId),
        ),
      );
    res.status(204).send();
  },
);

export default router;
