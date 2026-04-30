import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types";

export const requireAuth = () =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          requestId: c.get("requestId"),
        },
        401,
      );
    }

    await next();
  });