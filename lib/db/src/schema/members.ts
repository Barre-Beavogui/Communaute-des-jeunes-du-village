import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  age: integer("age").notNull(),
  neighborhood: text("neighborhood").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio").notNull(),
  activities: text("activities").array().notNull().default([]),
  project: text("project"),
  contact: text("contact"),
  instagram: text("instagram"),
  privacy: text("privacy").notNull().default("community"),
  status: text("status").notNull().default("approved"),
});

export const membershipRequestsTable = pgTable("membership_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  neighborhood: text("neighborhood").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
});

export const insertProfileSchema = createInsertSchema(profilesTable);
export const insertMembershipRequestSchema = createInsertSchema(membershipRequestsTable);
export type Profile = typeof profilesTable.$inferSelect;
export type MembershipRequest = typeof membershipRequestsTable.$inferSelect;