import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "./config/env";
import { registerOpenApiDocs } from "./docs/openapi";
import { authRoutes } from "./modules/auth/auth.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { apiV1Router } from "./modules/v1.routes";
import { requestLogger } from "./middleware/request-logger";
import { requestId } from "./middleware/request-id";
import { sessionMiddleware } from "./middleware/session";
import {
  httpExceptionError,
  internalError,
  notFoundError,
} from "./shared/errors/http.error";
import { logger } from "./shared/utils/logger";
import type { AppVariables } from "./shared/types/app.types";

export const app = new Hono<{ Variables: AppVariables }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return trustedFrontendOrigins[0] ?? "http://localhost:5173";
      const normalized = origin.replace(/\/$/, "");
      if (trustedFrontendOrigins.includes(normalized)) return normalized;
      if (env.CORS_ORIGIN.trim() === "*") return origin;
      return trustedFrontendOrigins[0] ?? "http://localhost:5173";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: corsCredentialsEnabled,
  }),
);

app.use("*", secureHeaders());
app.use("*", requestId());
app.use("*", requestLogger());
app.use("*", compress());
app.use("*", sessionMiddleware);

app.route("/api/auth", authRoutes);
app.route("/health", healthRoutes);
app.route("/api/v1", apiV1Router);

registerOpenApiDocs(app);

app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Hono API",
  }),
);

app.notFound((c) => {
  const { body, status } = notFoundError(c.get("requestId"));
  return c.json(body, status);
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
    const { body } = httpExceptionError(requestId, err.message);
    return c.json(body, err.status);
  }

  const { body, status } = internalError(
    requestId,
    env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  );
  return c.json(body, status);
});
