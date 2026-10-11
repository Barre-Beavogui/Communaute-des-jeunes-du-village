import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, count, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  chatMessageReportsTable,
  chatMessagesTable,
  chatPresenceTable,
  chatReadReceiptsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  GetChatUnreadCountResponse,
  ListChatMessagesResponse,
  ListChatPresenceResponse,
  MarkChatReadResponse,
  ReportChatMessageBody,
  ReportChatMessageParams,
  ReportChatMessageResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  UpdateChatPresenceBody,
  UpdateChatPresenceResponse,
} from "@workspace/api-zod";
import { loadChatMessages } from "../lib/chat-data.js";
import {
  publishChatEvent,
  subscribeToChatEvents,
} from "../lib/chat-realtime.js";
import { requireMember } from "../lib/member-auth.js";
import { persistDataUrl } from "../lib/media-storage.js";
import { consumeRateLimit } from "../lib/rate-limit.js";

const router: IRouter = Router();
const AUDIO_DATA_PATTERN =
  /^data:(audio\/(?:webm|ogg|mp4|mpeg|wav|x-m4a));base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_AUDIO_BYTES = 450_000;
const ONLINE_WINDOW_MS = 75_000;
const ACTIVE_WINDOW_MS = 15_000;
const MESSAGE_LIMIT = 40;
const MESSAGE_WINDOW_MS = 5 * 60 * 1000;

type Activity = "online" | "typing" | "recording";

async function touchPresence(profileId: string, activity?: Activity) {
  const now = new Date();
  const nextActivity = activity ?? "online";
  const activityUntil = new Date(
    now.getTime() + (nextActivity === "online" ? 0 : ACTIVE_WINDOW_MS),
  );
  const update = activity
    ? { lastSeen: now, activity: nextActivity, activityUntil }
    : { lastSeen: now };

  await db
    .insert(chatPresenceTable)
    .values({
      profileId,
      lastSeen: now,
      activity: nextActivity,
      activityUntil,
    })
    .onConflictDoUpdate({
      target: chatPresenceTable.profileId,
      set: update,
    });
}

router.get("/chat/stream", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  await touchPresence(profileId);
  await subscribeToChatEvents(req, res);
});

router.get("/chat/messages", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  await touchPresence(profileId);
  const messages = await loadChatMessages({ memberProfileId: profileId });
  res.json(ListChatMessagesResponse.parse(messages));
});

router.post("/chat/messages", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  if (
    !(await consumeRateLimit(
      "chat-message",
      profileId,
      MESSAGE_LIMIT,
      MESSAGE_WINDOW_MS,
    ))
  ) {
    res.status(429).json({
      error: "Trop de messages ont été envoyés. Attendez quelques minutes.",
    });
    return;
  }

  const body = SendChatMessageBody.parse(req.body);
  let content: string | null = null;
  let audioData: string | null = null;
  let audioUrl: string | null = null;
  let audioMimeType: string | null = null;
  let durationSeconds: number | null = null;

  if (body.replyToId) {
    const [replyTarget] = await db
      .select({ id: chatMessagesTable.id })
      .from(chatMessagesTable)
      .where(
        and(
          eq(chatMessagesTable.id, body.replyToId),
          isNull(chatMessagesTable.recipientId),
        ),
      );
    if (!replyTarget) {
      res
        .status(400)
        .json({ error: "Le message auquel vous répondez n’existe plus." });
      return;
    }
  }

  if (body.type === "text") {
    content = body.content?.trim() || null;
    if (!content) {
      res.status(400).json({ error: "Écrivez un message avant de l’envoyer." });
      return;
    }
  } else {
    const audioMatch = body.audioData?.match(AUDIO_DATA_PATTERN);
    const duration = Math.round(body.durationSeconds ?? 0);
    if (
      !audioMatch ||
      duration < 1 ||
      duration > 30 ||
      Buffer.from(audioMatch[2]!, "base64").byteLength > MAX_AUDIO_BYTES
    ) {
      res.status(400).json({
        error: "Le vocal est invalide ou dépasse la durée autorisée.",
      });
      return;
    }
    try {
      audioUrl = await persistDataUrl(body.audioData, {
        folder: "chat-audio",
        kind: "audio",
        maxBytes: MAX_AUDIO_BYTES,
      });
    } catch {
      res.status(400).json({ error: "Le vocal n’a pas pu être enregistré." });
      return;
    }
    // Keep legacy local development working until object storage is connected.
    audioData = audioUrl?.startsWith("data:") ? audioUrl : null;
    if (audioData) audioUrl = null;
    audioMimeType = audioMatch[1]!;
    durationSeconds = duration;
  }

  const [profile] = await db
    .select({
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId));
  if (!profile) {
    res.status(401).json({ error: "Ce compte membre n’est plus actif." });
    return;
  }

  const messageId = randomUUID();
  await db.insert(chatMessagesTable).values({
    id: messageId,
    profileId,
    type: body.type,
    content,
    audioData,
    audioUrl,
    audioMimeType,
    durationSeconds,
    replyToId: body.replyToId ?? null,
  });
  await touchPresence(profileId);
  await publishChatEvent({ type: "message", profileId, messageId });

  const [message] = await loadChatMessages({
    limit: 1,
    memberProfileId: profileId,
    newestFirst: true,
  });
  res.status(201).json(SendChatMessageResponse.parse(message));
});

router.get("/chat/presence", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  await touchPresence(profileId);
  const now = new Date();
  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);
  await db
    .delete(chatPresenceTable)
    .where(lt(chatPresenceTable.lastSeen, onlineSince));

  const profiles = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
      activity: chatPresenceTable.activity,
      activityUntil: chatPresenceTable.activityUntil,
    })
    .from(chatPresenceTable)
    .innerJoin(
      profilesTable,
      eq(chatPresenceTable.profileId, profilesTable.id),
    );

  const result = profiles
    .map((profile) => ({
      profileId: profile.id,
      memberName: profile.name,
      initials: profile.initials,
      avatarUrl: profile.avatarUrl,
      activity:
        profile.activityUntil.getTime() > now.getTime()
          ? (profile.activity as Activity)
          : ("online" as const),
    }))
    .sort((a, b) => {
      if (a.activity !== "online" && b.activity === "online") return -1;
      if (a.activity === "online" && b.activity !== "online") return 1;
      return a.memberName.localeCompare(b.memberName, "fr");
    });

  res.json(ListChatPresenceResponse.parse(result));
});

router.post("/chat/presence", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const body = UpdateChatPresenceBody.parse(req.body);
  await touchPresence(profileId, body.activity);
  await publishChatEvent({ type: "presence", profileId });
  res.json(UpdateChatPresenceResponse.parse({ success: true }));
});

router.get("/chat/unread", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const [receipt] = await db
    .select()
    .from(chatReadReceiptsTable)
    .where(eq(chatReadReceiptsTable.profileId, profileId));
  const filters = [ne(chatMessagesTable.profileId, profileId)];
  filters.push(isNull(chatMessagesTable.recipientId));
  if (receipt)
    filters.push(gt(chatMessagesTable.createdAt, receipt.lastReadAt));
  const [result] = await db
    .select({ value: count() })
    .from(chatMessagesTable)
    .where(and(...filters));
  res.json(GetChatUnreadCountResponse.parse({ count: result?.value ?? 0 }));
});

router.post("/chat/read", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const lastReadAt = new Date();
  await db
    .insert(chatReadReceiptsTable)
    .values({ profileId, lastReadAt })
    .onConflictDoUpdate({
      target: chatReadReceiptsTable.profileId,
      set: { lastReadAt },
    });
  res.json(
    MarkChatReadResponse.parse({
      success: true,
      lastReadAt: lastReadAt.toISOString(),
    }),
  );
});

router.post("/chat/messages/:id/report", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const params = ReportChatMessageParams.parse(req.params);
  const body = ReportChatMessageBody.parse(req.body);
  const [message] = await db
    .select({
      id: chatMessagesTable.id,
      profileId: chatMessagesTable.profileId,
    })
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.id, params.id),
        isNull(chatMessagesTable.recipientId),
      ),
    );
  if (!message) {
    res.status(404).json({ error: "Message introuvable." });
    return;
  }
  if (message.profileId === profileId) {
    res
      .status(400)
      .json({ error: "Vous ne pouvez pas signaler votre propre message." });
    return;
  }
  await db
    .insert(chatMessageReportsTable)
    .values({
      messageId: params.id,
      profileId,
      reason: body.reason.trim(),
    })
    .onConflictDoUpdate({
      target: [
        chatMessageReportsTable.messageId,
        chatMessageReportsTable.profileId,
      ],
      set: {
        reason: body.reason.trim(),
        status: "pending",
        createdAt: new Date(),
      },
    });
  await publishChatEvent({
    type: "moderation",
    profileId,
    messageId: params.id,
  });
  res.status(201).json(ReportChatMessageResponse.parse({ success: true }));
});

export default router;
