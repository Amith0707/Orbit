import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { AppError } from "../utils/app-error.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = join(__dirname, "..", "uploads");

mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.badRequest("Only JPEG, PNG, WEBP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function publicUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}
