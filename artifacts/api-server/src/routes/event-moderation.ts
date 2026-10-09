import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { eventResponsesTable, eventsTable } from "@workspace/db/schema";
import {
  CreateEventBody,
  CreateEventResponse,
  DeleteEventParams,
  ListModerationEventsResponse,
  UpdateEventBody,
  UpdateEventParams,
  UpdateEventResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";
import { loadEvents } from "../lib/event-data.js";

const router: IRouter = Router();
router.use("/moderation", requireAdmin);

router.get("/moderation/events", async (_req, res) => {
  res.json(ListModerationEventsResponse.parse(await loadEvents(null)));
});

function cleanReportUrl(value: string | null | undefined) {
  const raw = value?.trim() || null;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

router.post("/moderation/events", async (req, res) => {
  const body = CreateEventBody.parse(req.body);
  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    res.status(400).json({ error: "La date de l’événement est invalide." });
    return;
  }
  const eventId = randomUUID();
  await db.insert(eventsTable).values({
    id: eventId,
    title: body.title.trim(),
    startsAt,
    location: body.location.trim(),
    agenda: body.agenda.trim(),
    status: body.status,
    reportTitle: body.reportTitle?.trim() || null,
    reportContent: body.reportContent?.trim() || null,
    reportUrl: cleanReportUrl(body.reportUrl),
  });
  const [created] = (await loadEvents(null)).filter(
    (event) => event.id === eventId,
  );
  res.status(201).json(CreateEventResponse.parse(created));
});

router.patch("/moderation/events/:id", async (req, res) => {
  const params = UpdateEventParams.parse(req.params);
  const body = UpdateEventBody.parse(req.body);
  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    res.status(400).json({ error: "La date de l’événement est invalide." });
    return;
  }
  const [updated] = await db
    .update(eventsTable)
    .set({
      title: body.title.trim(),
      startsAt,
      location: body.location.trim(),
      agenda: body.agenda.trim(),
      status: body.status,
      reportTitle: body.reportTitle?.trim() || null,
      reportContent: body.reportContent?.trim() || null,
      reportUrl: cleanReportUrl(body.reportUrl),
    })
    .where(eq(eventsTable.id, params.id))
    .returning({ id: eventsTable.id });
  if (!updated) {
    res.status(404).json({ error: "Événement introuvable." });
    return;
  }
  const [event] = (await loadEvents(null)).filter(
    (item) => item.id === params.id,
  );
  res.json(UpdateEventResponse.parse(event));
});

router.delete("/moderation/events/:id", async (req, res) => {
  const params = DeleteEventParams.parse(req.params);
  const deleted = await db.transaction(async (tx) => {
    const [event] = await tx
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(eq(eventsTable.id, params.id));
    if (!event) return false;
    await tx
      .delete(eventResponsesTable)
      .where(eq(eventResponsesTable.eventId, params.id));
    await tx.delete(eventsTable).where(eq(eventsTable.id, params.id));
    return true;
  });
  if (!deleted) {
    res.status(404).json({ error: "Événement introuvable." });
    return;
  }
  res.status(204).send();
});

export default router;
