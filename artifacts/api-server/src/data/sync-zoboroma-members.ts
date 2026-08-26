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
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_email text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_email_normalized text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_phone text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_phone_normalized text`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT true`,
  );
  await db.execute(
    sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true`,
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
    CREATE TABLE IF NOT EXISTS announcement_dislikes (
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

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_content_seeds (
      key text PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id text PRIMARY KEY,
      profile_id text NOT NULL,
      requested_at timestamp NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'pending'
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS password_reset_requests_pending_profile
    ON password_reset_requests (profile_id)
    WHERE status = 'pending'
  `);

  await db.execute(sql`
    WITH inserted_seed AS (
      INSERT INTO app_content_seeds (key)
      VALUES ('prochaine-reunion-2026-08')
      ON CONFLICT DO NOTHING
      RETURNING key
    ),
    inserted_poll AS (
      INSERT INTO polls (id, question, status)
      SELECT
        'sondage-prochaine-reunion-2026-08',
        'Quel jour vous conviendrait pour la prochaine réunion ?',
        'open'
      FROM inserted_seed
      ON CONFLICT DO NOTHING
      RETURNING id
    )
    INSERT INTO poll_options (id, poll_id, label, position)
    SELECT option.id, inserted_poll.id, option.label, option.position
    FROM inserted_poll
    CROSS JOIN (
      VALUES
        ('choix-reunion-vendredi-soir', 'Vendredi soir', 0),
        ('choix-reunion-samedi', 'Samedi', 1),
        ('choix-reunion-dimanche-soir', 'Dimanche soir', 2)
    ) AS option(id, label, position)
    ON CONFLICT DO NOTHING
  `);

  await db.execute(sql`
    WITH inserted_seed AS (
      INSERT INTO app_content_seeds (key)
      VALUES ('annonce-partage-communaute-2026-08')
      ON CONFLICT DO NOTHING
      RETURNING key
    )
    INSERT INTO announcements (id, title, content)
    SELECT
      'annonce-partage-communaute-2026-08',
      'Hello la famille Zoboroma !',
      'Partagez cette annonce afin de permettre aux autres jeunes de Zoboroma de nous rejoindre et de se retrouver ici. Ensemble, faisons grandir notre communauté !'
    FROM inserted_seed
    ON CONFLICT DO NOTHING
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

  await db.execute(sql`
    UPDATE profiles AS profile
    SET
      login_email = COALESCE(profile.login_email, request.email),
      login_email_normalized = COALESCE(
        profile.login_email_normalized,
        lower(trim(request.email))
      ),
      login_phone = COALESCE(profile.login_phone, request.phone),
      login_phone_normalized = COALESCE(
        profile.login_phone_normalized,
        NULLIF(regexp_replace(COALESCE(request.phone, ''), '[^0-9]', '', 'g'), '')
      )
    FROM membership_requests AS request
    WHERE
      request.status = 'approved'
      AND right(profile.id, 8) = left(request.id, 8)
  `);

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
