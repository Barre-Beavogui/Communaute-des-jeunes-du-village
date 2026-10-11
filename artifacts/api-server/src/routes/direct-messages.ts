import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  chatMessagesTable,
  directMessageReadReceiptsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  GetDirectMessageThreadParams,
  GetDirectMessageThreadResponse,
  GetDirectMessageUnreadCountResponse,
  ListDirectMessageConversationsResponse,
  MarkDirectMessageReadParams,
  MarkDirectMessageReadResponse,
  SendDirectMessageBody,
  SendDirectMessageParams,
  SendDirectMessageResponse,
} from "@workspace/api-zod";
import { loadDirectMessages } from "../lib/direct-message-data.js";
import { requireMember } from "../lib/member-auth.js";
import { consumeRateLimit } from "../lib/rate-limit.js";

const router: IRouter = Router();
const MESSAGE_LIMIT = 60;
const MESSAGE_WINDOW_MS = 5 * 60 * 1000;

async function approvedProfile(profileId: string) {
  const [profile] = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.id, profileId),
        eq(profilesTable.status, "approved"),
      ),
    );
  return profile ?? null;
}

router.get(
  "/direct-messages/conversations",
  requireMember,
  async (_req, res) => {
    const profileId = res.locals["memberProfileId"] as string;
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(
        and(
          isNotNull(chatMessagesTable.recipientId),
          or(
            eq(chatMessagesTable.profileId, profileId),
            eq(chatMessagesTable.recipientId, profileId),
          ),
        ),
      )
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(500);
    const contactIds = [
      ...new Set(
        messages.map((message) =>
          message.profileId === profileId
            ? message.recipientId!
            : message.profileId,
        ),
      ),
    ];
    const [contacts, receipts] = await Promise.all([
      contactIds.length
        ? db
            .select({
              id: profilesTable.id,
              name: profilesTable.name,
              initials: profilesTable.initials,
              avatarUrl: profilesTable.avatarUrl,
            })
            .from(profilesTable)
            .where(inArray(profilesTable.id, contactIds))
        : [],
      db
        .select()
        .from(directMessageReadReceiptsTable)
        .where(eq(directMessageReadReceiptsTable.profileId, profileId)),
    ]);
    const contactById = new Map(
      contacts.map((contact) => [contact.id, contact]),
    );
    const readByContact = new Map(
      receipts.map((receipt) => [
        receipt.contactProfileId,
        receipt.lastReadAt.getTime(),
      ]),
    );
    const conversations = contactIds.flatMap((contactId) => {
      const contact = contactById.get(contactId);
      const latest = messages.find((message) =>
        [message.profileId, message.recipientId].includes(contactId),
      );
      if (!contact || !latest) return [];
      const readAt = readByContact.get(contactId) ?? 0;
      const unreadCount = messages.filter(
        (message) =>
          message.profileId === contactId &&
          message.recipientId === profileId &&
          message.createdAt.getTime() > readAt,
      ).length;
      return [
        {
          profileId: contact.id,
          memberName: contact.name,
          initials: contact.initials,
          avatarUrl: contact.avatarUrl,
          lastMessage: latest.content ?? "",
          lastMessageAt: latest.createdAt.toISOString(),
          unreadCount,
        },
      ];
    });
    res.json(ListDirectMessageConversationsResponse.parse(conversations));
  },
);

router.get("/direct-messages/unread", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const [incoming, receipts] = await Promise.all([
    db
      .select({
        senderId: chatMessagesTable.profileId,
        createdAt: chatMessagesTable.createdAt,
      })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.recipientId, profileId)),
    db
      .select()
      .from(directMessageReadReceiptsTable)
      .where(eq(directMessageReadReceiptsTable.profileId, profileId)),
  ]);
  const readByContact = new Map(
    receipts.map((receipt) => [
      receipt.contactProfileId,
      receipt.lastReadAt.getTime(),
    ]),
  );
  const count = incoming.filter(
    (message) =>
      message.createdAt.getTime() > (readByContact.get(message.senderId) ?? 0),
  ).length;
  res.json(GetDirectMessageUnreadCountResponse.parse({ count }));
});

router.get("/direct-messages/:profileId", requireMember, async (req, res) => {
  const params = GetDirectMessageThreadParams.parse(req.params);
  const profileId = res.locals["memberProfileId"] as string;
  if (
    params.profileId === profileId ||
    !(await approvedProfile(params.profileId))
  ) {
    res.status(404).json({ error: "Membre introuvable." });
    return;
  }
  const messages = await loadDirectMessages({
    viewerProfileId: profileId,
    contactProfileId: params.profileId,
    limit: 100,
  });
  res.json(GetDirectMessageThreadResponse.parse(messages));
});

router.post("/direct-messages/:profileId", requireMember, async (req, res) => {
  const params = SendDirectMessageParams.parse(req.params);
  const body = SendDirectMessageBody.parse(req.body);
  const profileId = res.locals["memberProfileId"] as string;
  if (params.profileId === profileId) {
    res
      .status(400)
      .json({ error: "Vous ne pouvez pas vous écrire à vous-même." });
    return;
  }
  if (!(await approvedProfile(params.profileId))) {
    res.status(404).json({ error: "Membre introuvable." });
    return;
  }
  if (
    !(await consumeRateLimit(
      "direct-message",
      profileId,
      MESSAGE_LIMIT,
      MESSAGE_WINDOW_MS,
    ))
  ) {
    res
      .status(429)
      .json({ error: "Trop de messages envoyés. Patientez quelques minutes." });
    return;
  }
  const content = body.content.trim();
  const id = randomUUID();
  await db.insert(chatMessagesTable).values({
    id,
    profileId,
    recipientId: params.profileId,
    type: "text",
    content,
  });
  const [message] = await loadDirectMessages({
    viewerProfileId: profileId,
    contactProfileId: params.profileId,
    limit: 1,
    newestFirst: true,
  });
  res.status(201).json(SendDirectMessageResponse.parse(message));
});

router.post(
  "/direct-messages/:profileId/read",
  requireMember,
  async (req, res) => {
    const params = MarkDirectMessageReadParams.parse(req.params);
    const profileId = res.locals["memberProfileId"] as string;
    const lastReadAt = new Date();
    await db
      .insert(directMessageReadReceiptsTable)
      .values({ profileId, contactProfileId: params.profileId, lastReadAt })
      .onConflictDoUpdate({
        target: [
          directMessageReadReceiptsTable.profileId,
          directMessageReadReceiptsTable.contactProfileId,
        ],
        set: { lastReadAt },
      });
    res.json(
      MarkDirectMessageReadResponse.parse({
        success: true,
        lastReadAt: lastReadAt.toISOString(),
      }),
    );
  },
);

export default router;
