import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  handleListUsers,
  handleSetUserRole,
  handleSetUserActive,
  handleListCommunities,
  handleSetCommunityArchived,
  handleListModerationPosts,
  handleModerationDeletePost,
} from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("administrator"));

adminRouter.get("/users", asyncHandler(handleListUsers));
adminRouter.patch("/users/:userId/role", asyncHandler(handleSetUserRole));
adminRouter.patch("/users/:userId/status", asyncHandler(handleSetUserActive));

adminRouter.get("/communities", asyncHandler(handleListCommunities));
adminRouter.patch("/communities/:communityId/archived", asyncHandler(handleSetCommunityArchived));

adminRouter.get("/moderation/posts", asyncHandler(handleListModerationPosts));
adminRouter.delete("/moderation/posts/:postId", asyncHandler(handleModerationDeletePost));
