import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const announcementsTable = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaType: text("media_type"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcementLikesTable = pgTable(
  "announcement_likes",
  {
    announcementId: text("announcement_id").notNull(),
    profileId: text("profile_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.announcementId, table.profileId] })],
);

export const announcementDislikesTable = pgTable(
  "announcement_dislikes",
  {
    announcementId: text("announcement_id").notNull(),
    profileId: text("profile_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.announcementId, table.profileId] })],
);

export const pollsTable = pgTable("polls", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pollOptionsTable = pgTable("poll_options", {
  id: text("id").primaryKey(),
  pollId: text("poll_id").notNull(),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const pollVotesTable = pgTable(
  "poll_votes",
  {
    pollId: text("poll_id").notNull(),
    optionId: text("option_id").notNull(),
    profileId: text("profile_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.pollId, table.profileId] })],
);

export type Announcement = typeof announcementsTable.$inferSelect;
export type AnnouncementLike = typeof announcementLikesTable.$inferSelect;
export type AnnouncementDislike = typeof announcementDislikesTable.$inferSelect;
export type Poll = typeof pollsTable.$inferSelect;
export type PollOption = typeof pollOptionsTable.$inferSelect;
export type PollVote = typeof pollVotesTable.$inferSelect;
