import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { chatMessagesTable, profilesTable } from "@workspace/db/schema";
import {
  ListChatMessagesResponse,
  ListChatPresenceResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  UpdateChatPresenceBody,
  UpdateChatPresenceResponse,
} from "@workspace/api-zod";
import { requireMember } from "../lib/member-auth";

const router: IRouter = Router();
const AUDIO_DATA_PATTERN =
  /^data:(audio\/(?:webm|ogg|mp4|mpeg|wav|x-m4a));base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_AUDIO_BYTES = 650_000;
const ONLINE_WINDOW_MS = 45_000;
const ACTIVE_WINDOW_MS = 7_000;
const MESSAGE_LIMIT = 40;
const MESSAGE_WINDOW_MS = 5 * 60 * 1000;

type Activity = "online" | "typing" | "recording";
type PresenceEntry = {
  lastSeen: number;
  activity: Activity;
  activityUntil: number;
};

const presenceByProfile = new Map<string, PresenceEntry>();
const messageSubmissions = new Map<
  string,
  { count: number; resetAt: number }
>();

function touchPresence(profileId: string, activity?: Activity) {
  const now = Date.now();
  const current = presenceByProfile.get(profileId);
  if (!activity && current) {
    presenceByProfile.set(profileId, { ...current, lastSeen: now });
    return;
  }
  const nextActivity = activity ?? "online";
  presenceByProfile.set(profileId, {
    lastSeen: now,
    activity: nextActivity,
    activityUntil: nextActivity === "online" ? now : now + ACTIVE_WINDOW_MS,
  });
}

function messageResponse(
  message: typeof chatMessagesTable.$inferSelect,
  profile: Pick<
    typeof profilesTable.$inferSelect,
    "name" | "initials" | "avatarUrl"
  >,
) {
  return {
    id: message.id,
    profileId: message.profileId,
    memberName: profile.name,
    initials: profile.initials,
    avatarUrl: profile.avatarUrl,
    type: message.type as "text" | "audio",
    content: message.content,
    audioData: message.audioData,
    audioMimeType: message.audioMimeType,
    durationSeconds: message.durationSeconds,
    createdAt: message.createdAt.toISOString(),
  };
}

router.get("/chat/messages", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  touchPresence(profileId);

  const rows = await db
    .select({
      message: chatMessagesTable,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(chatMessagesTable)
    .innerJoin(profilesTable, eq(chatMessagesTable.profileId, profilesTable.id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);

  res.json(
    ListChatMessagesResponse.parse(
      rows.reverse().map((row) =>
        messageResponse(row.message, {
          name: row.name,
          initials: row.initials,
          avatarUrl: row.avatarUrl,
        }),
      ),
    ),
  );
});

router.post("/chat/messages", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const now = Date.now();
  const current = messageSubmissions.get(profileId);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + MESSAGE_WINDOW_MS }
      : current;
  if (entry.count >= MESSAGE_LIMIT) {
    res.status(429).json({
      error: "Trop de messages ont été envoyés. Attendez quelques minutes.",
    });
    return;
  }

  const body = SendChatMessageBody.parse(req.body);
  let content: string | null = null;
  let audioData: string | null = null;
  let audioMimeType: string | null = null;
  let durationSeconds: number | null = null;

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
      duration > 45 ||
      Buffer.from(audioMatch[2]!, "base64").byteLength > MAX_AUDIO_BYTES
    ) {
      res.status(400).json({
        error: "Le vocal est invalide ou dépasse la durée autorisée.",
      });
      return;
    }
    audioData = body.audioData!;
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

  const [message] = await db
    .insert(chatMessagesTable)
    .values({
      id: randomUUID(),
      profileId,
      type: body.type,
      content,
      audioData,
      audioMimeType,
      durationSeconds,
    })
    .returning();

  messageSubmissions.set(profileId, { ...entry, count: entry.count + 1 });
  touchPresence(profileId);
  res
    .status(201)
    .json(SendChatMessageResponse.parse(messageResponse(message!, profile)));
});

router.get("/chat/presence", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  touchPresence(profileId);
  const now = Date.now();

  for (const [id, presence] of presenceByProfile) {
    if (presence.lastSeen < now - ONLINE_WINDOW_MS) {
      presenceByProfile.delete(id);
    }
  }

  const onlineIds = [...presenceByProfile.keys()];
  if (!onlineIds.length) {
    res.json([]);
    return;
  }

  const profiles = await db
    .select({
      id: profilesTable.id,
      name: profilesTable.name,
      initials: profilesTable.initials,
      avatarUrl: profilesTable.avatarUrl,
    })
    .from(profilesTable)
    .where(inArray(profilesTable.id, onlineIds));

  const result = profiles
    .map((profile) => {
      const presence = presenceByProfile.get(profile.id)!;
      return {
        profileId: profile.id,
        memberName: profile.name,
        initials: profile.initials,
        avatarUrl: profile.avatarUrl,
        activity:
          presence.activityUntil > now
            ? presence.activity
            : ("online" as const),
      };
    })
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
  touchPresence(profileId, body.activity);
  res.json(UpdateChatPresenceResponse.parse({ success: true }));
});

export default router;
