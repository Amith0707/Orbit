import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { handleListTags, handleListDepartmentsMeta } from "../controllers/meta.controller.js";

export const metaRouter = Router();

metaRouter.use(requireAuth);
metaRouter.get("/tags", asyncHandler(handleListTags));
metaRouter.get("/departments", asyncHandler(handleListDepartmentsMeta));
