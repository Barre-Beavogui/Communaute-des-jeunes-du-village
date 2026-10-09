import type { Request, Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import { logger } from "./logger.js";

export type ChatRealtimeEvent = {
  type: "message" | "presence" | "moderation" | "members";
  profileId?: string;
  messageId?: string;
  at?: string;
};

const CHANNEL = "zoboroma_chat_events";
const subscribers = new Set<Response>();
let listener: PoolClient | null = null;
let listenerPromise: Promise<void> | null = null;

function sendEvent(response: Response, event: ChatRealtimeEvent) {
  response.write(`event: ${event.type}\n`);
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function ensureListener() {
  if (listener || listenerPromise) return listenerPromise;
  listenerPromise = (async () => {
    const client = await pool.connect();
    listener = client;
    client.on("notification", (notification) => {
      if (notification.channel !== CHANNEL || !notification.payload) return;
      try {
        const event = JSON.parse(notification.payload) as ChatRealtimeEvent;
        for (const response of subscribers) sendEvent(response, event);
      } catch (error) {
        logger.warn({ err: error }, "Invalid realtime chat event");
      }
    });
    client.on("error", (error) => {
      logger.warn({ err: error }, "Realtime chat listener disconnected");
      listener = null;
      listenerPromise = null;
    });
    await client.query(`LISTEN ${CHANNEL}`);
  })()
    .catch((error) => {
      listener = null;
      logger.warn({ err: error }, "Unable to start realtime chat listener");
      throw error;
    })
    .finally(() => {
      listenerPromise = null;
    });
  return listenerPromise;
}

export async function publishChatEvent(event: ChatRealtimeEvent) {
  const payload = JSON.stringify({ ...event, at: new Date().toISOString() });
  try {
    await pool.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
  } catch (error) {
    logger.warn(
      { err: error, eventType: event.type },
      "Unable to publish realtime event",
    );
  }
}

export async function subscribeToChatEvents(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await ensureListener();
  } catch {
    res.status(503).end();
    return;
  }

  subscribers.add(res);
  res.write(`event: connected\ndata: {"ready":true}\n\n`);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15_000);
  const reconnect = setTimeout(() => res.end(), 50_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    clearTimeout(reconnect);
    subscribers.delete(res);
  };
  req.on("close", cleanup);
  res.on("close", cleanup);
}
