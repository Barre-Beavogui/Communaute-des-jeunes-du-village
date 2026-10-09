import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  chatMessageReportsTable,
  chatMessagesTable,
  profilesTable,
} from "@workspace/db/schema";

export async function loadChatMessages(options?: {
  limit?: number;
  memberProfileId?: string | null;
  newestFirst?: boolean;
}) {
  const rows = await db
    .select({
      message: chatMessagesTable,
      memberName: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(chatMessagesTable)
    .innerJoin(profilesTable, eq(chatMessagesTable.profileId, profilesTable.id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(options?.limit ?? 100);

  const replyIds = [
    ...new Set(
      rows
        .map(({ message }) => message.replyToId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const replyRows = replyIds.length
    ? await db
        .select({
          id: chatMessagesTable.id,
          memberName: profilesTable.name,
          type: chatMessagesTable.type,
          content: chatMessagesTable.content,
        })
        .from(chatMessagesTable)
        .innerJoin(
          profilesTable,
          eq(chatMessagesTable.profileId, profilesTable.id),
        )
        .where(inArray(chatMessagesTable.id, replyIds))
    : [];
  const replyById = new Map(replyRows.map((reply) => [reply.id, reply]));
  const reports = await db.select().from(chatMessageReportsTable);
  const reportCounts = new Map<string, number>();
  const reportedByMember = new Set<string>();
  for (const report of reports) {
    if (report.status === "pending") {
      reportCounts.set(
        report.messageId,
        (reportCounts.get(report.messageId) ?? 0) + 1,
      );
    }
    if (report.profileId === options?.memberProfileId) {
      reportedByMember.add(report.messageId);
    }
  }

  const messages = rows.map(({ message, memberName, initials, avatarUrl }) => ({
    id: message.id,
    profileId: message.profileId,
    memberName,
    initials,
    avatarUrl,
    type: message.type as "text" | "audio",
    content: message.content,
    audioData: message.audioData,
    audioUrl: message.audioUrl,
    audioMimeType: message.audioMimeType,
    durationSeconds: message.durationSeconds,
    createdAt: message.createdAt.toISOString(),
    pinnedAt: message.pinnedAt?.toISOString() ?? null,
    replyTo: message.replyToId
      ? (replyById.get(message.replyToId) ?? null)
      : null,
    reportedByMember: reportedByMember.has(message.id),
    reportCount: reportCounts.get(message.id) ?? 0,
  }));

  return options?.newestFirst ? messages : messages.reverse();
}
