import { inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { previousDemoProfileIds, zoboromaMembers } from "./zoboroma-members";

export async function syncZoboromaMembers() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id text PRIMARY KEY,
      name text NOT NULL,
      initials text NOT NULL,
      age integer,
      neighborhood text NOT NULL,
      avatar_url text,
      bio text NOT NULL,
      activities text[] NOT NULL DEFAULT ARRAY[]::text[],
      project text,
      contact text,
      instagram text,
      privacy text NOT NULL DEFAULT 'community',
      status text NOT NULL DEFAULT 'approved'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS membership_requests (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      neighborhood text NOT NULL,
      submitted_at timestamp NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'pending'
    )
  `);

  await db.transaction(async (tx) => {
    // Existing deployments created this legacy field as NOT NULL.
    await tx.execute(sql`ALTER TABLE profiles ALTER COLUMN age DROP NOT NULL`);

    await tx
      .insert(profilesTable)
      .values(zoboromaMembers)
      .onConflictDoNothing({ target: profilesTable.id });

    await tx
      .delete(profilesTable)
      .where(inArray(profilesTable.id, previousDemoProfileIds));
  });
}
