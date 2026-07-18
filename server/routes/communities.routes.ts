import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleCreate,
  handleList,
  handleListMine,
  handleGetBySlug,
  handleJoin,
  handleLeave,
  handleMembers,
} from "../controllers/communities.controller.js";
import { postsRouter } from "./posts.routes.js";
import { communityPollsRouter } from "./polls.routes.js";
import { challengesRouter } from "./challenges.routes.js";

export const communitiesRouter = Router();

communitiesRouter.use(requireAuth);

communitiesRouter.get("/mine", asyncHandler(handleListMine));
communitiesRouter.get("/", asyncHandler(handleList));
communitiesRouter.post("/", asyncHandler(handleCreate));
communitiesRouter.get("/:slug", asyncHandler(handleGetBySlug));
communitiesRouter.post("/:slug/join", asyncHandler(handleJoin));
communitiesRouter.post("/:slug/leave", asyncHandler(handleLeave));
communitiesRouter.get("/:slug/members", asyncHandler(handleMembers));
communitiesRouter.use("/:slug/posts", postsRouter);
communitiesRouter.use("/:slug/polls", communityPollsRouter);
communitiesRouter.use("/:slug/challenges", challengesRouter);
