import { Hono } from "hono";
import { ajApi } from "../../lib/arcjet";
import { handleArcjetDecision } from "../../lib/arcjet-deny";
import type { AppVariables } from "../../types";

export const defaultRouter = new Hono<{ Variables: AppVariables }>();

defaultRouter.get("/", async (c) => {
  const decision = await ajApi.protect(c.req.raw, {
    correlationId: c.get("requestId"),
  });
  const denied = handleArcjetDecision(c, decision);
  if (denied) return denied;

  return c.json({ message: "Hello, World!" });
});
