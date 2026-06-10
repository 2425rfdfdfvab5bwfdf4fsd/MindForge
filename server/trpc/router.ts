import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { habitsRouter } from "./routers/habits";
import { checkinsRouter } from "./routers/checkins";
import { cookiejarRouter } from "./routers/cookiejar";
import { challengesRouter } from "./routers/challenges";
import { analyticsRouter } from "./routers/analytics";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  user: userRouter,
  habits: habitsRouter,
  checkins: checkinsRouter,
  cookiejar: cookiejarRouter,
  challenges: challengesRouter,
  analytics: analyticsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
