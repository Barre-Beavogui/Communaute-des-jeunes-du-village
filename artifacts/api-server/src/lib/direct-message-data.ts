import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { chatMessagesTable, profilesTable } from "@workspace/db/schema";

export async function loadDirectMessages(options: {
  viewerProfileId?: string | null;
  contactProfileId?: string;
  limit?: number;
  newestFirst?: boolean;
}) {
  const participantFilter = options.viewerProfileId
    ? options.contactProfileId
      ? or(
          and(
            eq(chatMessagesTable.profileId, options.viewerProfileId),
            eq(chatMessagesTable.recipientId, options.contactProfileId),
          ),
          and(
            eq(chatMessagesTable.profileId, options.contactProfileId),
            eq(chatMessagesTable.recipientId, options.viewerProfileId),
          ),
        )
      : or(
          eq(chatMessagesTable.profileId, options.viewerProfileId),
          eq(chatMessagesTable.recipientId, options.viewerProfileId),
        )
    : undefined;
  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(
      participantFilter
        ? and(isNotNull(chatMessagesTable.recipientId), participantFilter)
        : isNotNull(chatMessagesTable.recipientId),
    )
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(options.limit ?? 100);
  const profileIds = [
    ...new Set(
      rows.flatMap((message) => [
        message.profileId,
        ...(message.recipientId ? [message.recipientId] : []),
      ]),
    ),
  ];
  const profiles = profileIds.length
    ? await db
        .select({
          id: profilesTable.id,
          name: profilesTable.name,
          initials: profilesTable.initials,
          avatarUrl: profilesTable.avatarUrl,
        })
        .from(profilesTable)
        .where(inArray(profilesTable.id, profileIds))
    : [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const messages = rows.map((message) => {
    const sender = profileById.get(message.profileId);
    const recipient = profileById.get(message.recipientId ?? "");
    return {
      id: message.id,
      senderId: message.profileId,
      senderName: sender?.name ?? "Membre supprimé",
      senderInitials: sender?.initials ?? "?",
      senderAvatarUrl: sender?.avatarUrl ?? null,
      recipientId: message.recipientId ?? "",
      recipientName: recipient?.name ?? "Membre supprimé",
      recipientInitials: recipient?.initials ?? "?",
      recipientAvatarUrl: recipient?.avatarUrl ?? null,
      content: message.content ?? "",
      createdAt: message.createdAt.toISOString(),
      mine: message.profileId === options.viewerProfileId,
    };
  });

  return options.newestFirst ? messages : messages.reverse();
}
