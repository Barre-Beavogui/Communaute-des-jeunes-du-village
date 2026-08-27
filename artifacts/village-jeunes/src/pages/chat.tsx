import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListChatMessagesQueryKey,
  getListChatPresenceQueryKey,
  updateChatPresence,
  useListChatMessages,
  useListChatPresence,
  useSendChatMessage,
} from "@workspace/api-client-react";
import {
  CircleStop,
  MessageCircleMore,
  Mic,
  Radio,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Avatar } from "@/components/village-shell";
import { getMemberIdentity } from "@/lib/member-session";

const MAX_RECORDING_SECONDS = 45;
const PREFERRED_AUDIO_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

type RecordedAudio = {
  data: string;
  mimeType: string;
  durationSeconds: number;
};

function messageTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat("fr-FR", {
    ...(sameDay ? {} : { day: "2-digit" as const, month: "short" as const }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function blobToAudioData(blob: Blob, mimeType: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du vocal impossible."));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const base64 = value.split(",")[1];
      if (!base64) {
        reject(new Error("Vocal invalide."));
        return;
      }
      resolve(`data:${mimeType};base64,${base64}`);
    };
    reader.readAsDataURL(blob);
  });
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const member = getMemberIdentity();
  const messagesQuery = useListChatMessages({
    query: {
      queryKey: getListChatMessagesQueryKey(),
      refetchInterval: 2_500,
      refetchIntervalInBackground: false,
    },
  });
  const presenceQuery = useListChatPresence({
    query: {
      queryKey: getListChatPresenceQueryKey(),
      refetchInterval: 2_500,
      refetchIntervalInBackground: false,
    },
  });
  const sendMessage = useSendChatMessage();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(
    null,
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef(0);
  const activityRef = useRef<"online" | "typing" | "recording">("online");
  const lastTypingPingRef = useRef(0);
  const typingResetRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messages = messagesQuery.data ?? [];
  const presences = presenceQuery.data ?? [];

  const activeDescription = useMemo(() => {
    const writing = presences.filter(
      (presence) =>
        presence.activity === "typing" && presence.profileId !== member?.id,
    );
    const recording = presences.filter(
      (presence) =>
        presence.activity === "recording" && presence.profileId !== member?.id,
    );
    if (recording.length) {
      return `${recording.map((presence) => presence.memberName).join(", ")} enregistre un vocal…`;
    }
    if (writing.length) {
      return `${writing.map((presence) => presence.memberName).join(", ")} écrit…`;
    }
    return "Le groupe est à jour";
  }, [member?.id, presences]);

  const pingActivity = (activity: "online" | "typing" | "recording") => {
    activityRef.current = activity;
    void updateChatPresence({ activity }).catch(() => undefined);
  };

  useEffect(() => {
    pingActivity("online");
    const heartbeat = window.setInterval(() => {
      pingActivity(activityRef.current);
    }, 15_000);
    return () => window.clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      durationRef.current += 1;
      setRecordingSeconds(durationRef.current);
      if (durationRef.current % 3 === 0) pingActivity("recording");
      if (durationRef.current >= MAX_RECORDING_SECONDS) {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (typingResetRef.current) {
        window.clearTimeout(typingResetRef.current);
      }
    },
    [],
  );

  const refreshChat = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListChatMessagesQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getListChatPresenceQueryKey(),
      }),
    ]);
  };

  const submitText = (event?: FormEvent) => {
    event?.preventDefault();
    const content = text.trim();
    if (!content || sendMessage.isPending) return;
    setError("");
    sendMessage.mutate(
      { data: { type: "text", content } },
      {
        onSuccess: async () => {
          setText("");
          pingActivity("online");
          await refreshChat();
        },
        onError: () =>
          setError("Le message n’a pas pu être envoyé. Réessayez."),
      },
    );
  };

  const onTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    if (typingResetRef.current) {
      window.clearTimeout(typingResetRef.current);
    }
    const now = Date.now();
    if (event.target.value.trim() && now - lastTypingPingRef.current > 2_500) {
      lastTypingPingRef.current = now;
      pingActivity("typing");
    }
    typingResetRef.current = window.setTimeout(() => {
      if (activityRef.current !== "recording") pingActivity("online");
    }, 4_500);
  };

  const onTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitText();
    }
  };

  const startRecording = async () => {
    setError("");
    setRecordedAudio(null);
    if (typingResetRef.current) {
      window.clearTimeout(typingResetRef.current);
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "L’enregistrement vocal n’est pas disponible sur ce navigateur.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;
      const mimeType = PREFERRED_AUDIO_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];
      durationRef.current = 0;
      setRecordingSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        pingActivity("online");
        const durationSeconds = Math.max(1, durationRef.current);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        const normalizedMime = blob.type.split(";")[0] || "audio/webm";
        try {
          const data = await blobToAudioData(blob, normalizedMime);
          if (data.length > 900_000) {
            setError(
              "Ce vocal est trop volumineux. Enregistrez un message plus court.",
            );
            return;
          }
          setRecordedAudio({
            data,
            mimeType: normalizedMime,
            durationSeconds,
          });
        } catch {
          setError("Le vocal n’a pas pu être préparé.");
        }
      };
      recorder.start(250);
      setIsRecording(true);
      pingActivity("recording");
    } catch {
      setError(
        "Autorisez l’accès au microphone pour enregistrer un message vocal.",
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const sendRecordedAudio = () => {
    if (!recordedAudio || sendMessage.isPending) return;
    setError("");
    sendMessage.mutate(
      {
        data: {
          type: "audio",
          audioData: recordedAudio.data,
          audioMimeType: recordedAudio.mimeType,
          durationSeconds: recordedAudio.durationSeconds,
        },
      },
      {
        onSuccess: async () => {
          setRecordedAudio(null);
          pingActivity("online");
          await refreshChat();
        },
        onError: () => setError("Le vocal n’a pas pu être envoyé."),
      },
    );
  };

  return (
    <div className="vj-enter mx-auto max-w-6xl">
      <section className="mb-5 flex flex-col justify-between gap-4 rounded-[26px] bg-foreground px-6 py-7 text-background sm:flex-row sm:items-end sm:px-8">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
            Groupe de communication
          </p>
          <h1 className="vj-display mt-2 text-5xl leading-[.9] sm:text-6xl">
            La famille Zoboroma.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-background/65">
            Échangez par texte ou message vocal. Les photos et les vidéos ne
            sont pas autorisées dans ce groupe.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-background/10 px-4 py-2.5 text-xs font-bold">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          {presences.length} en ligne
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <section className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircleMore className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold">Discussion générale</h2>
                <p
                  className="mt-0.5 text-[11px] font-semibold text-emerald-600"
                  aria-live="polite"
                >
                  {activeDescription}
                </p>
              </div>
            </div>
            <Radio className="h-5 w-5 text-secondary" />
          </div>

          <div className="h-[52vh] min-h-[390px] space-y-4 overflow-y-auto bg-muted/25 px-4 py-6 sm:px-6">
            {messagesQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : messagesQuery.isError ? (
              <p className="py-16 text-center text-sm text-destructive">
                La discussion est temporairement indisponible.
              </p>
            ) : messages.length ? (
              messages.map((message) => {
                const mine = message.profileId === member?.id;
                return (
                  <article
                    key={message.id}
                    className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        profile={{ ...message, name: message.memberName }}
                        size="sm"
                      />
                      {presences.some(
                        (presence) => presence.profileId === message.profileId,
                      ) && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500"
                          aria-label="En ligne"
                        />
                      )}
                    </div>
                    <div className={`max-w-[78%] ${mine ? "text-right" : ""}`}>
                      <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-bold text-muted-foreground">
                        <span>{mine ? "Vous" : message.memberName}</span>
                        <time>{messageTime(message.createdAt)}</time>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-left text-sm leading-6 ${
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border border-border bg-card"
                        }`}
                      >
                        {message.type === "audio" && message.audioData ? (
                          <div className="min-w-[220px]">
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                              <Mic className="h-4 w-4" /> Message vocal ·{" "}
                              {formatDuration(message.durationSeconds ?? 0)}
                            </div>
                            <audio
                              controls
                              preload="metadata"
                              src={message.audioData}
                              className="h-9 w-full max-w-[280px]"
                            >
                              Votre navigateur ne peut pas lire ce vocal.
                            </audio>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <MessageCircleMore className="mx-auto h-9 w-9 text-primary" />
                  <p className="mt-4 text-sm font-extrabold">
                    Commencez la discussion
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Envoyez le premier message à la famille.
                  </p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4 sm:p-5">
            {recordedAudio ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-accent/25 p-4 sm:flex-row sm:items-center">
                <audio
                  controls
                  preload="metadata"
                  src={recordedAudio.data}
                  className="h-10 min-w-0 flex-1"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordedAudio(null)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-destructive"
                    aria-label="Supprimer le vocal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={sendRecordedAudio}
                    disabled={sendMessage.isPending}
                    className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Envoyer le vocal
                  </button>
                </div>
              </div>
            ) : isRecording ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold">Enregistrement…</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDuration(recordingSeconds)} / 0:45
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground"
                >
                  <CircleStop className="h-4 w-4" /> Arrêter
                </button>
              </div>
            ) : (
              <form onSubmit={submitText} className="flex items-end gap-2">
                <textarea
                  rows={1}
                  maxLength={1000}
                  value={text}
                  onChange={onTextChange}
                  onKeyDown={onTextKeyDown}
                  placeholder="Écrivez à la famille…"
                  className="field min-h-12 flex-1 resize-none py-3.5"
                  aria-label="Votre message"
                />
                <button
                  type="button"
                  onClick={startRecording}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-card text-primary hover:bg-primary/10"
                  aria-label="Enregistrer un message vocal"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || sendMessage.isPending}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                  aria-label="Envoyer le message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}
            <p className="mt-3 text-[10px] text-muted-foreground">
              Entrée pour envoyer · Maj + Entrée pour aller à la ligne · Vocal
              limité à 45 secondes
            </p>
          </div>
        </section>

        <aside className="h-fit overflow-hidden rounded-[26px] border border-border bg-card shadow-sm lg:sticky lg:top-28">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <UsersRound className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-extrabold">Membres présents</h2>
              <p className="text-[10px] text-muted-foreground">
                Activité en direct
              </p>
            </div>
          </div>
          <div className="max-h-[520px] space-y-1 overflow-y-auto p-3">
            {presences.map((presence) => (
              <div
                key={presence.profileId}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-muted/60"
              >
                <div className="relative shrink-0">
                  <Avatar
                    profile={{ ...presence, name: presence.memberName }}
                    size="sm"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold">
                    {presence.profileId === member?.id
                      ? "Vous"
                      : presence.memberName}
                  </p>
                  <p
                    className={`truncate text-[10px] font-semibold ${
                      presence.activity === "online"
                        ? "text-emerald-600"
                        : "text-primary"
                    }`}
                  >
                    {presence.activity === "typing"
                      ? "écrit…"
                      : presence.activity === "recording"
                        ? "enregistre un vocal…"
                        : "En ligne"}
                  </p>
                </div>
              </div>
            ))}
            {!presences.length && (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                Aucun membre en ligne.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
