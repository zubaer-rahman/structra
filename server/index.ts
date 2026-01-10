import { createCallerFactory, router } from "./trpc";
import { authRouter } from "./modules/auth";
import { usersRouter } from "./modules/users";
import { projectsRouter } from "./modules/projects";
import { proposalsRouter } from "./modules/proposals";
import { messagesRouter } from "./modules/messages";
import { transactionsRouter } from "./modules/transactions";
import { reviewsRouter } from "./modules/reviews";
import { adminRouter } from "./modules/admin";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  projects: projectsRouter,
  proposals: proposalsRouter,
  messages: messagesRouter,
  transactions: transactionsRouter,
  reviews: reviewsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
