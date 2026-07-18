import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { config } from "./config/env.js";
import { UPLOADS_DIR } from "./middleware/upload.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Allow the SPA to load its own assets/images cross-origin-safely without fighting Vite's dev server.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: config.isProduction ? false : true,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(morgan(config.isProduction ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (existsSync(UPLOADS_DIR)) {
    app.use("/uploads", express.static(UPLOADS_DIR));
  }

  app.use("/api", apiRouter);
  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  if (config.isProduction) {
    const clientDist = join(__dirname, "..", "client");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(join(clientDist, "index.html"));
    });
  }

  return app;
}
