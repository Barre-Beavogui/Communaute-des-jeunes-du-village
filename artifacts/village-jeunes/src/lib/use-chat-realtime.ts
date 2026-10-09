import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetChatUnreadCountQueryKey,
  getListChatMessagesQueryKey,
  getListChatPresenceQueryKey,
} from "@workspace/api-client-react";
import { apiUrl } from "@/lib/api-url";
import { MEMBER_TOKEN_KEY } from "@/lib/member-session";

export function useChatRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const token = sessionStorage.getItem(MEMBER_TOKEN_KEY);
    if (!token) return;

    let stopped = false;
    let controller: AbortController | null = null;
    let retryTimer: number | null = null;
    let retryDelay = 1_000;

    const invalidate = async (eventName: string) => {
      const tasks: Promise<unknown>[] = [];
      if (eventName === "message" || eventName === "moderation") {
        tasks.push(
          queryClient.invalidateQueries({
            queryKey: getListChatMessagesQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetChatUnreadCountQueryKey(),
          }),
        );
      }
      if (eventName === "presence") {
        tasks.push(
          queryClient.invalidateQueries({
            queryKey: getListChatPresenceQueryKey(),
          }),
        );
      }
      await Promise.all(tasks);
    };

    const connect = async () => {
      controller = new AbortController();
      try {
        const response = await fetch(apiUrl("/api/chat/stream"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("stream");
        retryDelay = 1_000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const packets = buffer.split("\n\n");
          buffer = packets.pop() ?? "";
          for (const packet of packets) {
            const eventName = packet
              .split("\n")
              .find((line) => line.startsWith("event:"))
              ?.slice(6)
              .trim();
            if (eventName) void invalidate(eventName);
          }
        }
      } catch (error) {
        if (controller?.signal.aborted) return;
      }
      if (!stopped) {
        retryTimer = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15_000);
      }
    };

    void connect();
    return () => {
      stopped = true;
      controller?.abort();
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [enabled, queryClient]);
}
