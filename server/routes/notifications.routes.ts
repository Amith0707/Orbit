import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { handleList, handleMarkRead, handleMarkAllRead } from "../controllers/notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/", asyncHandler(handleList));
notificationsRouter.post("/read-all", asyncHandler(handleMarkAllRead));
notificationsRouter.post("/:notificationId/read", asyncHandler(handleMarkRead));
