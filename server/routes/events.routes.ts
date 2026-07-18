import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleCreate,
  handleList,
  handleGet,
  handleRsvp,
  handleRemoveRsvp,
  handleParticipants,
} from "../controllers/events.controller.js";

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.get("/", asyncHandler(handleList));
eventsRouter.post("/", asyncHandler(handleCreate));
eventsRouter.get("/:eventId", asyncHandler(handleGet));
eventsRouter.post("/:eventId/rsvp", asyncHandler(handleRsvp));
eventsRouter.delete("/:eventId/rsvp", asyncHandler(handleRemoveRsvp));
eventsRouter.get("/:eventId/participants", asyncHandler(handleParticipants));
