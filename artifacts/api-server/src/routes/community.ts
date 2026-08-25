import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementLikesTable,
  announcementsTable,
  pollOptionsTable,
  pollsTable,
  pollVotesTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  ListAnnouncementsResponse,
  ListPollsResponse,
  ToggleAnnouncementLikeParams,
  ToggleAnnouncementLikeResponse,
  VotePollBody,
  VotePollParams,
  VotePollResponse,
} from "@workspace/api-zod";
import { loadAnnouncements, loadPolls } from "../lib/community-data";
import { requireCommunityAccess } from "../lib/community-access";
import { optionalMemberProfileId, requireMember } from "../lib/member-auth";

const router: IRouter = Router();

async function isApprovedMember(profileId: string) {
  const [profile] = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.id, profileId),
        eq(profilesTable.status, "approved"),
      ),
    );
  return Boolean(profile);
}

router.get("/announcements", requireCommunityAccess, async (req, res) => {
  const rows = await loadAnnouncements(optionalMemberProfileId(req));
  res.json(ListAnnouncementsResponse.parse(rows));
});

router.post("/announcements/:id/like", requireMember, async (req, res) => {
  const params = ToggleAnnouncementLikeParams.parse(req.params);
  const profileId = res.locals["memberProfileId"] as string;
  const [[announcement], approved] = await Promise.all([
    db
      .select({ id: announcementsTable.id })
      .from(announcementsTable)
      .where(eq(announcementsTable.id, params.id)),
    isApprovedMember(profileId),
  ]);

  if (!approved) {
    res.status(401).json({ error: "Ce compte membre n’est plus actif." });
    return;
  }
  if (!announcement) {
    res.status(404).json({ error: "Annonce introuvable." });
    return;
  }

  const [existing] = await db
    .select()
    .from(announcementLikesTable)
    .where(
      and(
        eq(announcementLikesTable.announcementId, params.id),
        eq(announcementLikesTable.profileId, profileId),
      ),
    );

  if (existing) {
    await db
      .delete(announcementLikesTable)
      .where(
        and(
          eq(announcementLikesTable.announcementId, params.id),
          eq(announcementLikesTable.profileId, profileId),
        ),
      );
  } else {
    await db.insert(announcementLikesTable).values({
      announcementId: params.id,
      profileId,
    });
  }

  const likes = await db
    .select({ profileId: announcementLikesTable.profileId })
    .from(announcementLikesTable)
    .where(eq(announcementLikesTable.announcementId, params.id));
  res.json(
    ToggleAnnouncementLikeResponse.parse({
      liked: !existing,
      likeCount: likes.length,
    }),
  );
});

router.get("/polls", requireCommunityAccess, async (req, res) => {
  const rows = await loadPolls(optionalMemberProfileId(req));
  res.json(ListPollsResponse.parse(rows));
});

router.post("/polls/:id/vote", requireMember, async (req, res) => {
  const params = VotePollParams.parse(req.params);
  const body = VotePollBody.parse(req.body);
  const profileId = res.locals["memberProfileId"] as string;
  const [[poll], [option], approved] = await Promise.all([
    db.select().from(pollsTable).where(eq(pollsTable.id, params.id)),
    db
      .select()
      .from(pollOptionsTable)
      .where(
        and(
          eq(pollOptionsTable.id, body.optionId),
          eq(pollOptionsTable.pollId, params.id),
        ),
      ),
    isApprovedMember(profileId),
  ]);

  if (!approved) {
    res.status(401).json({ error: "Ce compte membre n’est plus actif." });
    return;
  }
  if (!poll || !option) {
    res.status(404).json({ error: "Sondage ou choix introuvable." });
    return;
  }
  if (poll.status !== "open") {
    res.status(409).json({ error: "Ce sondage est fermé." });
    return;
  }

  await db
    .insert(pollVotesTable)
    .values({ pollId: params.id, optionId: body.optionId, profileId })
    .onConflictDoUpdate({
      target: [pollVotesTable.pollId, pollVotesTable.profileId],
      set: { optionId: body.optionId, createdAt: new Date() },
    });

  const [updated] = await loadPolls(profileId, params.id);
  res.json(VotePollResponse.parse(updated));
});

export default router;
