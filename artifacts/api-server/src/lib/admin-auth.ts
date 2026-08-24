import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function adminPassword() {
  return process.env["ADMIN_PASSWORD"]?.trim() ?? "";
}

function sessionSecret() {
  return process.env["ADMIN_SESSION_SECRET"]?.trim() ?? "";
}

export function adminIsConfigured() {
  return adminPassword().length >= 12 && sessionSecret().length >= 32;
}

export function passwordMatches(candidate: string) {
  const expected = Buffer.from(adminPassword());
  const received = Buffer.from(candidate);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminSession() {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const payload = Buffer.from(
    JSON.stringify({ exp: expiresAt.getTime() }),
  ).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function isValidAdminToken(token: string) {
  if (!adminIsConfigured()) return false;

  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return false;

  const expectedSignature = sign(payload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!isValidAdminToken(token)) {
    res.status(401).json({ error: "Connexion administrateur requise." });
    return;
  }

  next();
};
