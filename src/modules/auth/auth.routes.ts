import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import type { AppVariables } from "../../shared/types/app.types";
import { authController } from "./auth.controller";
import { authDocs } from "./auth.docs";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.on(
  ["POST", "GET"],
  "/*",
  describeRoute({
    tags: authDocs.getSession.tags,
    summary: "Better Auth handler",
    description:
      "Catch-all route for Better Auth endpoints (sign-up, sign-in, session, etc.).",
    responses: authDocs.getSession.responses,
  }),
  (c) => authController.handleAuthRequest(c),
);
