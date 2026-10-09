import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { eventResponsesTable, eventsTable } from "@workspace/db/schema";
import {
  ListEventsResponse,
  RespondToEventBody,
  RespondToEventParams,
  RespondToEventResponse,
} from "@workspace/api-zod";
import { loadEvents } from "../lib/event-data.js";
import { requireMember } from "../lib/member-auth.js";

const router: IRouter = Router();

router.get("/events", requireMember, async (_req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  res.json(ListEventsResponse.parse(await loadEvents(profileId)));
});

router.post("/events/:id/respond", requireMember, async (req, res) => {
  const profileId = res.locals["memberProfileId"] as string;
  const params = RespondToEventParams.parse(req.params);
  const body = RespondToEventBody.parse(req.body);
  const [event] = await db
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(
      and(eq(eventsTable.id, params.id), eq(eventsTable.status, "upcoming")),
    );
  if (!event) {
    res.status(404).json({ error: "Cet événement n’est plus disponible." });
    return;
  }

  await db
    .insert(eventResponsesTable)
    .values({ eventId: params.id, profileId, response: body.response })
    .onConflictDoUpdate({
      target: [eventResponsesTable.eventId, eventResponsesTable.profileId],
      set: { response: body.response, respondedAt: new Date() },
    });
  const events = await loadEvents(profileId);
  const updated = events.find((item) => item.id === params.id);
  res.json(RespondToEventResponse.parse(updated));
});

export default router;
