import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types";

export const requestId = () =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const id = c.req.header("x-request-id") ?? crypto.randomUUID();

    c.set("requestId", id);

    try {
      await next();
    } finally {
      c.res.headers.set("x-request-id", id);
    }
  });
