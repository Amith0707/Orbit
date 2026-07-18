import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { usersRouter } from "./users.routes.js";
import { metaRouter } from "./meta.routes.js";
import { communitiesRouter } from "./communities.routes.js";
import { postDetailRouter } from "./post-detail.routes.js";
import { challengeDetailRouter } from "./challenges.routes.js";
import { eventsRouter } from "./events.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { searchRouter } from "./search.routes.js";
import { aiRouter } from "./ai.routes.js";
import { gamesRouter } from "./games.routes.js";
import { adminRouter } from "./admin.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/meta", metaRouter);
apiRouter.use("/communities", communitiesRouter);
apiRouter.use("/posts", postDetailRouter);
apiRouter.use("/challenges", challengeDetailRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/admin", adminRouter);
