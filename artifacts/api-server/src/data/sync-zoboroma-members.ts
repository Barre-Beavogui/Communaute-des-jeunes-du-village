import { inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { deletedProfilesTable, profilesTable } from "@workspace/db/schema";
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
      phone text,
      avatar_url text,
      neighborhood text NOT NULL,
      profession text NOT NULL DEFAULT 'Autre',
      bio text NOT NULL DEFAULT '',
      project text,
      submitted_at timestamp NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'pending'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS deleted_profiles (
      id text PRIMARY KEY,
      deleted_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_code_hash text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_code_created_at timestamp`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_password_hash text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_password_set_at timestamp`,
  );
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_code_hash_unique
    ON profiles (member_code_hash)
    WHERE member_code_hash IS NOT NULL
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS announcements (
      id text PRIMARY KEY,
      title text NOT NULL,
      content text NOT NULL,
      media_type text,
      media_url text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS announcement_likes (
      announcement_id text NOT NULL,
      profile_id text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      PRIMARY KEY (announcement_id, profile_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS polls (
      id text PRIMARY KEY,
      question text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS poll_options (
      id text PRIMARY KEY,
      poll_id text NOT NULL,
      label text NOT NULL,
      position integer NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS poll_votes (
      poll_id text NOT NULL,
      option_id text NOT NULL,
      profile_id text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      PRIMARY KEY (poll_id, profile_id)
    )
  `);

  await db.execute(
    sql`ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS phone text`,
  );
  await db.execute(
    sql`ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS avatar_url text`,
  );
  await db.execute(
    sql`ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS profession text NOT NULL DEFAULT 'Autre'`,
  );
  await db.execute(
    sql`ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT ''`,
  );
  await db.execute(
    sql`ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS project text`,
  );

  await db.transaction(async (tx) => {
    // Existing deployments created this legacy field as NOT NULL.
    await tx.execute(sql`ALTER TABLE profiles ALTER COLUMN age DROP NOT NULL`);

    const deletedProfiles = await tx
      .select({ id: deletedProfilesTable.id })
      .from(deletedProfilesTable);
    const deletedIds = new Set(deletedProfiles.map(({ id }) => id));
    const membersToSync = zoboromaMembers.filter(
      ({ id }) => !deletedIds.has(id),
    );

    if (membersToSync.length) {
      await tx
        .insert(profilesTable)
        .values(membersToSync)
        .onConflictDoNothing({ target: profilesTable.id });
    }

    await tx
      .delete(profilesTable)
      .where(inArray(profilesTable.id, previousDemoProfileIds));
  });
}
