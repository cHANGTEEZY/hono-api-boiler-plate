import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import type { AppVariables } from "../../shared/types/app.types";
import { healthController } from "./health.controller";
import { healthDocs } from "./health.docs";

export const healthRoutes = new Hono<{ Variables: AppVariables }>();

healthRoutes.get(
  "/",
  describeRoute(healthDocs.getHealth),
  (c) => healthController.getHealth(c),
);
