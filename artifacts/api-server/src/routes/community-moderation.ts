import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementDislikesTable,
  announcementLikesTable,
  announcementsTable,
  pollOptionsTable,
  pollsTable,
  pollVotesTable,
} from "@workspace/db/schema";
import {
  CreateAnnouncementBody,
  CreateAnnouncementResponse,
  CreatePollBody,
  CreatePollResponse,
  DeleteAnnouncementParams,
  DeletePollParams,
  UpdatePollStatusBody,
  UpdatePollStatusParams,
  UpdatePollStatusResponse,
} from "@workspace/api-zod";
import { loadPolls } from "../lib/community-data";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();
const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
]);

function cleanMedia(
  mediaType: "image" | "video" | null | undefined,
  rawMediaUrl: string | null | undefined,
) {
  const type = mediaType ?? null;
  const mediaUrl = rawMediaUrl?.trim() || null;
  if (!type && !mediaUrl) return { mediaType: null, mediaUrl: null };
  if (!type || !mediaUrl) return null;

  if (type === "image") {
    if (!/^data:image\/(jpeg|png|webp);base64,/i.test(mediaUrl)) return null;
    return { mediaType: type, mediaUrl };
  }

  try {
    const url = new URL(mediaUrl);
    if (url.protocol !== "https:" || !VIDEO_HOSTS.has(url.hostname))
      return null;
    return { mediaType: type, mediaUrl: url.toString() };
  } catch {
    return null;
  }
}

router.use("/moderation", requireAdmin);

router.post("/moderation/announcements", async (req, res) => {
  const body = CreateAnnouncementBody.parse(req.body);
  const media = cleanMedia(body.mediaType, body.mediaUrl);
  if (!media) {
    res.status(400).json({
      error: "Ajoutez une photo valide ou un lien YouTube/Vimeo sécurisé.",
    });
    return;
  }

  const [row] = await db
    .insert(announcementsTable)
    .values({
      id: randomUUID(),
      title: body.title.trim(),
      content: body.content.trim(),
      ...media,
    })
    .returning();

  res.status(201).json(
    CreateAnnouncementResponse.parse({
      id: row!.id,
      title: row!.title,
      content: row!.content,
      mediaType: row!.mediaType,
      mediaUrl: row!.mediaUrl,
      createdAt: row!.createdAt.toISOString(),
      likeCount: 0,
      dislikeCount: 0,
      likedByMember: false,
      dislikedByMember: false,
    }),
  );
});

router.delete("/moderation/announcements/:id", async (req, res) => {
  const params = DeleteAnnouncementParams.parse(req.params);
  const deleted = await db.transaction(async (tx) => {
    const [announcement] = await tx
      .select({ id: announcementsTable.id })
      .from(announcementsTable)
      .where(eq(announcementsTable.id, params.id));
    if (!announcement) return false;

    await tx
      .delete(announcementLikesTable)
      .where(eq(announcementLikesTable.announcementId, params.id));
    await tx
      .delete(announcementDislikesTable)
      .where(eq(announcementDislikesTable.announcementId, params.id));
    await tx
      .delete(announcementsTable)
      .where(eq(announcementsTable.id, params.id));
    return true;
  });

  if (!deleted) {
    res.status(404).json({ error: "Annonce introuvable." });
    return;
  }
  res.status(204).send();
});

router.post("/moderation/polls", async (req, res) => {
  const body = CreatePollBody.parse(req.body);
  const options = body.options.map((option) => option.trim()).filter(Boolean);
  const uniqueOptions = new Set(options.map((option) => option.toLowerCase()));
  if (options.length < 2 || uniqueOptions.size !== options.length) {
    res.status(400).json({ error: "Ajoutez au moins deux choix différents." });
    return;
  }

  const pollId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(pollsTable).values({
      id: pollId,
      question: body.question.trim(),
    });
    await tx.insert(pollOptionsTable).values(
      options.map((label, position) => ({
        id: randomUUID(),
        pollId,
        label,
        position,
      })),
    );
  });

  const [poll] = await loadPolls(null, pollId);
  res.status(201).json(CreatePollResponse.parse(poll));
});

router.patch("/moderation/polls/:id", async (req, res) => {
  const params = UpdatePollStatusParams.parse(req.params);
  const body = UpdatePollStatusBody.parse(req.body);
  const [updated] = await db
    .update(pollsTable)
    .set({ status: body.status })
    .where(eq(pollsTable.id, params.id))
    .returning({ id: pollsTable.id });

  if (!updated) {
    res.status(404).json({ error: "Sondage introuvable." });
    return;
  }
  const [poll] = await loadPolls(null, params.id);
  res.json(UpdatePollStatusResponse.parse(poll));
});

router.delete("/moderation/polls/:id", async (req, res) => {
  const params = DeletePollParams.parse(req.params);
  const deleted = await db.transaction(async (tx) => {
    const [poll] = await tx
      .select({ id: pollsTable.id })
      .from(pollsTable)
      .where(eq(pollsTable.id, params.id));
    if (!poll) return false;

    await tx.delete(pollVotesTable).where(eq(pollVotesTable.pollId, params.id));
    await tx
      .delete(pollOptionsTable)
      .where(eq(pollOptionsTable.pollId, params.id));
    await tx.delete(pollsTable).where(eq(pollsTable.id, params.id));
    return true;
  });

  if (!deleted) {
    res.status(404).json({ error: "Sondage introuvable." });
    return;
  }
  res.status(204).send();
});

export default router;
