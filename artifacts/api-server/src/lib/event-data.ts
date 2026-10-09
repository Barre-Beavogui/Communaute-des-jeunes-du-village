import { asc } from "drizzle-orm";
import { db } from "@workspace/db";
import { eventResponsesTable, eventsTable } from "@workspace/db/schema";

export async function loadEvents(memberProfileId: string | null) {
  const [events, responses] = await Promise.all([
    db.select().from(eventsTable).orderBy(asc(eventsTable.startsAt)),
    db.select().from(eventResponsesTable),
  ]);

  return events.map((event) => {
    const eventResponses = responses.filter(
      (response) => response.eventId === event.id,
    );
    return {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      location: event.location,
      agenda: event.agenda,
      status: event.status as "upcoming" | "completed" | "cancelled",
      reportTitle: event.reportTitle,
      reportContent: event.reportContent,
      reportUrl: event.reportUrl,
      createdAt: event.createdAt.toISOString(),
      attendingCount: eventResponses.filter(
        (response) => response.response === "attending",
      ).length,
      unavailableCount: eventResponses.filter(
        (response) => response.response === "unavailable",
      ).length,
      memberResponse:
        (eventResponses.find(
          (response) => response.profileId === memberProfileId,
        )?.response as "attending" | "unavailable" | undefined) ?? null,
    };
  });
}
