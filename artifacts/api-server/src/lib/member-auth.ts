import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, RequestHandler } from "express";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SETUP_SESSION_DURATION_MS = 15 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const scryptAsync = promisify(scrypt);

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
  return createSignedSession(profileId, "member", SESSION_DURATION_MS);
}

export function createMemberSetupSession(profileId: string) {
  return createSignedSession(
    profileId,
    "member-setup",
    SETUP_SESSION_DURATION_MS,
  );
}

function createSignedSession(
  profileId: string,
  role: "member" | "member-setup",
  durationMs: number,
) {
  const expiresAt = new Date(Date.now() + durationMs);
  const payload = Buffer.from(
    JSON.stringify({
      exp: expiresAt.getTime(),
      profileId,
      role,
    }),
  ).toString("base64url");

  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function readMemberToken(
  token: string,
  expectedRole: "member" | "member-setup",
) {
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
      decoded.role !== expectedRole ||
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

export function authorizationToken(req: Request) {
  const authorization = req.header("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

export function optionalMemberProfileId(req: Request) {
  return readMemberToken(authorizationToken(req), "member");
}

export function optionalMemberSetupProfileId(req: Request) {
  return readMemberToken(authorizationToken(req), "member-setup");
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

export const requireMemberSetup: RequestHandler = (req, res, next) => {
  const profileId = optionalMemberSetupProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: "Session de première connexion requise." });
    return;
  }

  res.locals["memberProfileId"] = profileId;
  next();
};

export async function hashMemberPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyMemberPassword(
  password: string,
  storedHash: string,
) {
  const [algorithm, salt, expectedHex, extra] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || extra) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = (await scryptAsync(
      password,
      salt,
      expected.length,
    )) as Buffer;
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  } catch {
    return false;
  }
}
