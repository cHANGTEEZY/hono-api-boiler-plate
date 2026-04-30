import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { describeRoute, openAPIRouteHandler, resolver } from "hono-openapi";
import { auth } from "./auth";
import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "./config/env";
import { mergeCorsIntoAuthResponse } from "./lib/cors-merge";
import { rootOkSchema } from "./lib/api-schemas";
import { logger } from "./lib/logger";
import { requestLogger } from "./middlewares/request-logger";
import { requestId } from "./middlewares/request-id";
import healthRouter from "./routes/health";
import type { AppVariables } from "./types";
import { apiV1Router } from "./routes/v1";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("*", compress());

app.route("/health", healthRouter);
app.route("/api/v1", apiV1Router);

app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Heart to Heart API",
  }),
);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
      requestId: c.get("requestId"),
    },
    404,
  );
});

function applyCorsHeadersOnError(
  c: Parameters<typeof app.onError>[0] extends (err: any, c: infer Ctx) => any
    ? Ctx
    : never,
) {
  const origin = c.req.header("origin");
  if (!origin) return;

  const normalizedOrigin = origin.replace(/\/$/, "");
  const isAllowed =
    env.CORS_ORIGIN.trim() === "*" ||
    trustedFrontendOrigins.includes(normalizedOrigin);

  if (!isAllowed) return;

  c.header("Access-Control-Allow-Origin", normalizedOrigin);
  c.header("Vary", "Origin");
  if (corsCredentialsEnabled) {
    c.header("Access-Control-Allow-Credentials", "true");
  }
}

app.onError((err, c) => {
  const requestId = c.get("requestId");
  applyCorsHeadersOnError(c);

  logger.error(
    {
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      err,
    },
    "request failed",
  );

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_EXCEPTION",
          message: err.message,
        },
        requestId,
      },
      err.status,
    );
  }

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          env.NODE_ENV === "production" ? "Something went wrong" : err.message,
      },
      requestId,
    },
    500,
  );
});
