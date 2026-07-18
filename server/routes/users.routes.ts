import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import {
  handleGetMe,
  handleUpdateMe,
  handleUploadAvatar,
  handleGetUserById,
  handleListDirectory,
} from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", asyncHandler(handleGetMe));
usersRouter.patch("/me", asyncHandler(handleUpdateMe));
usersRouter.post("/me/avatar", uploadImage.single("avatar"), asyncHandler(handleUploadAvatar));
usersRouter.get("/", asyncHandler(handleListDirectory));
usersRouter.get("/:userId", asyncHandler(handleGetUserById));
