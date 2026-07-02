import { Hono } from "hono";
import { aj } from "../lib/arcjet";
import { handleArcjetDecision } from "../lib/arcjet-deny";
import type { AppVariables } from "../types";

const healthRouter = new Hono<{ Variables: AppVariables }>();

healthRouter.get("/", async (c) => {
  const decision = await aj.protect(c.req.raw, {
    correlationId: c.get("requestId"),
  });
  const denied = handleArcjetDecision(c, decision);
  if (denied) return denied;

  return c.json({ message: "OK" });
});

export default healthRouter;
