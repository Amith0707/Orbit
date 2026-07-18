import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { handleSearch } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.use(requireAuth);
searchRouter.get("/", asyncHandler(handleSearch));
