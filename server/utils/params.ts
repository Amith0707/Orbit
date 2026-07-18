import type { Request } from "express";
import { AppError } from "./app-error.js";

// @types/express-serve-static-core types req.params values as `string | string[]` to account for
// repeated-segment routes; every route in this app uses single named segments, so this narrows safely.
export function pathParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== "string") {
    throw AppError.badRequest(`Missing path parameter: ${key}`);
  }
  return value;
}
