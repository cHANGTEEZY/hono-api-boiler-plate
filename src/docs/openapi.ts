import { openAPIRouteHandler } from "hono-openapi";
import type { Hono } from "hono";
import type { AppVariables } from "../shared/types/app.types";

export function registerOpenApiDocs(app: Hono<{ Variables: AppVariables }>) {
  app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Hono API",
          version: "1.0.0",
          description:
            "REST API with Better Auth, PostgreSQL, Drizzle ORM, and Arcjet security.",
        },
        tags: [
          { name: "Health", description: "Service health endpoints" },
          { name: "Auth", description: "Better Auth endpoints" },
          { name: "Users", description: "User profile endpoints" },
        ],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "better-auth.session_token",
            },
          },
        },
      },
    }),
  );
}
