import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleGetPost,
  handlePin,
  handleUnpin,
  handleDeletePost,
  handleReact,
  handleRemoveReaction,
  handleListComments,
  handleCreateComment,
  handleDeleteComment,
} from "../controllers/posts.controller.js";
import { pollsRouter } from "./polls.routes.js";

// Mounted at /api/posts — actions on a specific post by id, independent of community nesting.
export const postDetailRouter = Router();

postDetailRouter.use(requireAuth);

postDetailRouter.get("/:postId", asyncHandler(handleGetPost));
postDetailRouter.delete("/:postId", asyncHandler(handleDeletePost));
postDetailRouter.post("/:postId/pin", asyncHandler(handlePin));
postDetailRouter.post("/:postId/unpin", asyncHandler(handleUnpin));
postDetailRouter.post("/:postId/reactions", asyncHandler(handleReact));
postDetailRouter.delete("/:postId/reactions", asyncHandler(handleRemoveReaction));
postDetailRouter.get("/:postId/comments", asyncHandler(handleListComments));
postDetailRouter.post("/:postId/comments", asyncHandler(handleCreateComment));
postDetailRouter.delete("/comments/:commentId", asyncHandler(handleDeleteComment));
postDetailRouter.use("/:postId/poll", pollsRouter);
