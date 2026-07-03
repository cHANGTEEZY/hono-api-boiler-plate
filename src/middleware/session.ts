import { createMiddleware } from "hono/factory";
import { auth } from "../modules/auth/auth.service";
import type { AppVariables } from "../shared/types/app.types";

export const sessionMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      await next();
      return;
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  },
);
