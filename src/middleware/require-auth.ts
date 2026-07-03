import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../shared/types/app.types";
import { unauthorizedError } from "../shared/errors/http.error";

export const requireAuth = () =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      const { body, status } = unauthorizedError(c.get("requestId"));
      return c.json(body, status);
    }

    await next();
  });
