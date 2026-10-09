import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

const DATA_URL_PATTERN =
  /^data:(image\/(?:jpeg|png|webp)|audio\/(?:webm|ogg|mp4|mpeg|wav|x-m4a));base64,([A-Za-z0-9+/]+={0,2})$/i;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
};

export function dedicatedMediaStorageEnabled() {
  return Boolean(process.env["BLOB_READ_WRITE_TOKEN"]?.trim());
}

export async function persistDataUrl(
  value: string | null | undefined,
  options: {
    folder: "avatars" | "announcements" | "chat-audio";
    kind: "image" | "audio";
    maxBytes: number;
  },
) {
  const dataUrl = value?.trim() || null;
  if (!dataUrl) return null;
  if (/^https:\/\//i.test(dataUrl)) return dataUrl;

  const match = dataUrl.match(DATA_URL_PATTERN);
  if (!match || !match[1]!.toLowerCase().startsWith(`${options.kind}/`)) {
    throw new Error("MEDIA_INVALID");
  }

  const contentType = match[1]!.toLowerCase();
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.byteLength > options.maxBytes) throw new Error("MEDIA_TOO_LARGE");

  const token = process.env["BLOB_READ_WRITE_TOKEN"]?.trim();
  if (!token) {
    // Local development remains usable. Production switches automatically to
    // dedicated object storage as soon as Vercel Blob is connected.
    return dataUrl;
  }

  const extension = EXTENSIONS[contentType] ?? "bin";
  const blob = await put(
    `zoboroma/${options.folder}/${randomUUID()}.${extension}`,
    bytes,
    {
      access: "public",
      addRandomSuffix: false,
      contentType,
      token,
    },
  );
  return blob.url;
}
