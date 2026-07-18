import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleMe,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(handleRegister));
authRouter.post("/login", asyncHandler(handleLogin));
authRouter.post("/refresh", asyncHandler(handleRefresh));
authRouter.post("/logout", asyncHandler(handleLogout));
authRouter.post("/logout-all", requireAuth, asyncHandler(handleLogoutAll));
authRouter.get("/me", requireAuth, asyncHandler(handleMe));
