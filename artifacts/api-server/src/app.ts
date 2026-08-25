import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const configuredOrigins = (process.env["PUBLIC_WEB_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  "https://zoboroma.online",
  "https://www.zoboroma.online",
  "https://barre-beavogui.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const allowAnyOrigin =
  configuredOrigins.length === 0 && process.env["NODE_ENV"] !== "production";
const publicReadOnly = process.env["PUBLIC_READ_ONLY"] === "true";

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAnyOrigin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  "/api",
  (req, res, next) => {
    const isReadRequest = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    const isAdminRequest = req.path.startsWith("/moderation");
    const isPublicWrite =
      req.method === "POST" &&
      [
        "/admin/login",
        "/member/activate",
        "/member/login",
        "/member/set-password",
        "/membership-requests",
      ].includes(req.path);
    const isMemberWrite =
      req.method === "POST" &&
      (/^\/announcements\/[^/]+\/like$/.test(req.path) ||
        /^\/announcements\/[^/]+\/dislike$/.test(req.path) ||
        /^\/polls\/[^/]+\/vote$/.test(req.path));

    if (
      publicReadOnly &&
      !isReadRequest &&
      !isAdminRequest &&
      !isPublicWrite &&
      !isMemberWrite
    ) {
      res
        .status(403)
        .json({ error: "Cette version publique est en lecture seule." });
      return;
    }

    next();
  },
  router,
);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 413
  ) {
    res.status(413).json({ error: "La photo envoyée est trop volumineuse." });
    return;
  }

  if (
    error instanceof SyntaxError ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError")
  ) {
    res
      .status(400)
      .json({ error: "Les informations envoyées sont invalides." });
    return;
  }

  logger.error({ err: error }, "Unhandled API error");
  res.status(500).json({ error: "Une erreur interne est survenue." });
};

app.use(errorHandler);

export default app;
