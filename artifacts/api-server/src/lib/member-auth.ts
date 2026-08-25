import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Request, RequestHandler } from "express";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function sessionSecret() {
  return process.env["ADMIN_SESSION_SECRET"]?.trim() ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

export function memberAuthIsConfigured() {
  return sessionSecret().length >= 32;
}

export function normalizeMemberCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashMemberCode(value: string) {
  return createHash("sha256").update(normalizeMemberCode(value)).digest("hex");
}

export function generateMemberCode() {
  const bytes = randomBytes(8);
  const suffix = Array.from(
    bytes,
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join("");
  return `ZOB-${suffix.slice(0, 4)}-${suffix.slice(4)}`;
}

export function createMemberSession(profileId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const payload = Buffer.from(
    JSON.stringify({
      exp: expiresAt.getTime(),
      profileId,
      role: "member",
    }),
  ).toString("base64url");

  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function readMemberToken(token: string) {
  if (!memberAuthIsConfigured()) return null;

  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(receivedSignature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown; profileId?: unknown; role?: unknown };

    if (
      decoded.role !== "member" ||
      typeof decoded.profileId !== "string" ||
      typeof decoded.exp !== "number" ||
      decoded.exp <= Date.now()
    ) {
      return null;
    }

    return decoded.profileId;
  } catch {
    return null;
  }
}

export function optionalMemberProfileId(req: Request) {
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  return readMemberToken(token);
}

export const requireMember: RequestHandler = (req, res, next) => {
  const profileId = optionalMemberProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: "Connexion membre requise." });
    return;
  }

  res.locals["memberProfileId"] = profileId;
  next();
};
