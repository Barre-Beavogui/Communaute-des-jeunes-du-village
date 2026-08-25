import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  announcementLikesTable,
  announcementsTable,
  pollOptionsTable,
  pollsTable,
  pollVotesTable,
} from "@workspace/db/schema";

export async function loadAnnouncements(memberProfileId: string | null) {
  const [announcements, likes] = await Promise.all([
    db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt)),
    db.select().from(announcementLikesTable),
  ]);

  const counts = new Map<string, number>();
  const liked = new Set<string>();
  for (const like of likes) {
    counts.set(like.announcementId, (counts.get(like.announcementId) ?? 0) + 1);
    if (like.profileId === memberProfileId) liked.add(like.announcementId);
  }

  return announcements.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    mediaType: row.mediaType as "image" | "video" | null,
    mediaUrl: row.mediaUrl,
    createdAt: row.createdAt.toISOString(),
    likeCount: counts.get(row.id) ?? 0,
    likedByMember: liked.has(row.id),
  }));
}

export async function loadPolls(
  memberProfileId: string | null,
  onlyPollId?: string,
) {
  const polls = onlyPollId
    ? await db.select().from(pollsTable).where(eq(pollsTable.id, onlyPollId))
    : await db.select().from(pollsTable).orderBy(desc(pollsTable.createdAt));
  const [options, votes] = await Promise.all([
    db.select().from(pollOptionsTable),
    db.select().from(pollVotesTable),
  ]);

  return polls.map((poll) => {
    const pollOptions = options
      .filter((option) => option.pollId === poll.id)
      .sort((left, right) => left.position - right.position);
    const pollVotes = votes.filter((vote) => vote.pollId === poll.id);
    const voteCounts = new Map<string, number>();
    for (const vote of pollVotes) {
      voteCounts.set(vote.optionId, (voteCounts.get(vote.optionId) ?? 0) + 1);
    }

    return {
      id: poll.id,
      question: poll.question,
      status: poll.status as "open" | "closed",
      createdAt: poll.createdAt.toISOString(),
      totalVotes: pollVotes.length,
      selectedOptionId:
        pollVotes.find((vote) => vote.profileId === memberProfileId)
          ?.optionId ?? null,
      options: pollOptions.map((option) => ({
        id: option.id,
        label: option.label,
        voteCount: voteCounts.get(option.id) ?? 0,
      })),
    };
  });
}
