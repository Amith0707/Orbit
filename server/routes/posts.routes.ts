import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { handleCreatePost, handleListPosts } from "../controllers/posts.controller.js";

// Mounted at /api/communities/:slug/posts — needs the parent's :slug param.
export const postsRouter = Router({ mergeParams: true });

postsRouter.get("/", asyncHandler(handleListPosts));
postsRouter.post("/", asyncHandler(handleCreatePost));
