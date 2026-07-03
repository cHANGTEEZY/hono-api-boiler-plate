import type { Context } from "hono";
import { aj } from "../../shared/utils/arcjet";
import { handleArcjetDecision } from "../../shared/utils/arcjet-deny";
import type { AppVariables } from "../../shared/types/app.types";

type HealthContext = Context<{ Variables: AppVariables }>;

export const healthController = {
  async getHealth(c: HealthContext) {
    const decision = await aj.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
    const denied = handleArcjetDecision(c, decision);
    if (denied) return denied;

    return c.json({ message: "OK" });
  },
};
