import { createMiddleware } from "hono/factory";
import { logger } from "../shared/utils/logger";
import type { AppVariables } from "../shared/types/app.types";

export const requestLogger = () =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const startedAt = performance.now();

    await next();

    const durationMs = Math.round(performance.now() - startedAt);

    logger.info(
      {
        requestId: c.get("requestId"),
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        durationMs,
      },
      "request completed",
    );
  });
