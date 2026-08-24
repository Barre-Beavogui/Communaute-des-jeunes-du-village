import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const allowedOrigins = (process.env["PUBLIC_WEB_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const publicReadOnly = process.env["PUBLIC_READ_ONLY"] === "true";

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
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  (req, res, next) => {
    const isReadRequest = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    const isPrivateModerationRoute = req.path.startsWith("/moderation");

    if (publicReadOnly && (!isReadRequest || isPrivateModerationRoute)) {
      res
        .status(403)
        .json({ error: "Cette version publique est en lecture seule." });
      return;
    }

    next();
  },
  router,
);

export default app;
