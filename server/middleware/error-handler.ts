import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { config } from "../config/env.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: "Validation failed", details: err.flatten().fieldErrors },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      message: "Something went wrong. Please try again.",
      ...(config.isProduction ? {} : { stack: err instanceof Error ? err.stack : String(err) }),
    },
  });
}
