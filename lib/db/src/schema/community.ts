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

export const chatPresenceTable = pgTable("chat_presence", {
  profileId: text("profile_id").primaryKey(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  activity: text("activity").notNull().default("online"),
  activityUntil: timestamp("activity_until").notNull().defaultNow(),
});

export const eventsTable = pgTable("community_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  location: text("location").notNull(),
  agenda: text("agenda").notNull(),
  status: text("status").notNull().default("upcoming"),
  reportTitle: text("report_title"),
  reportContent: text("report_content"),
  reportUrl: text("report_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventResponsesTable = pgTable(
  "event_responses",
  {
    eventId: text("event_id").notNull(),
    profileId: text("profile_id").notNull(),
    response: text("response").notNull(),
    respondedAt: timestamp("responded_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.profileId] })],
);

export const communityRolesTable = pgTable("community_roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profileRolesTable = pgTable(
  "profile_roles",
  {
    profileId: text("profile_id").notNull(),
    roleId: text("role_id").notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.roleId] })],
);

export const financeMonthsTable = pgTable("finance_months", {
  monthKey: text("month_key").primaryKey(),
  targetAmount: integer("target_amount").notNull().default(0),
  expectedPerMember: integer("expected_per_member").notNull().default(0),
  currency: text("currency").notNull().default("GNF"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const financeContributionsTable = pgTable(
  "finance_contributions",
  {
    monthKey: text("month_key").notNull(),
    profileId: text("profile_id").notNull(),
    amount: integer("amount").notNull().default(0),
    note: text("note"),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.monthKey, table.profileId] })],
);

export type Announcement = typeof announcementsTable.$inferSelect;
export type AnnouncementLike = typeof announcementLikesTable.$inferSelect;
export type AnnouncementDislike = typeof announcementDislikesTable.$inferSelect;
export type Poll = typeof pollsTable.$inferSelect;
export type PollOption = typeof pollOptionsTable.$inferSelect;
export type PollVote = typeof pollVotesTable.$inferSelect;
export type ChatPresence = typeof chatPresenceTable.$inferSelect;
export type CommunityEvent = typeof eventsTable.$inferSelect;
export type EventResponse = typeof eventResponsesTable.$inferSelect;
export type CommunityRole = typeof communityRolesTable.$inferSelect;
export type ProfileRole = typeof profileRolesTable.$inferSelect;
export type FinanceMonth = typeof financeMonthsTable.$inferSelect;
export type FinanceContribution = typeof financeContributionsTable.$inferSelect;
