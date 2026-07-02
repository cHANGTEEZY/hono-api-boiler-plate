import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth";
import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "./config/env";
import { mergeCorsIntoAuthResponse } from "./lib/cors-merge";
import { ajAuth, ajAuthSignup } from "./lib/arcjet";
import { handleArcjetDecision } from "./lib/arcjet-deny";
import { logger } from "./lib/logger";
import { requestLogger } from "./middlewares/request-logger";
import { requestId } from "./middlewares/request-id";
import healthRouter from "./routes/health";
import type { AppVariables } from "./types";
import { apiV1Router } from "./routes/v1";

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

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const pathname = new URL(c.req.url).pathname;
  const isSignup = pathname.includes("/sign-up");

  let decision;
  if (isSignup && c.req.method === "POST") {
    let email: string | undefined;
    try {
      const body = (await c.req.raw.clone().json()) as { email?: string };
      email = body.email;
    } catch {
      email = undefined;
    }

    decision = email
      ? await ajAuthSignup.protect(c.req.raw, {
          email,
          correlationId: c.get("requestId"),
        })
      : await ajAuth.protect(c.req.raw, {
          correlationId: c.get("requestId"),
        });
  } else {
    decision = await ajAuth.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
  }

  const denied = handleArcjetDecision(c, decision);
  if (denied) {
    return mergeCorsIntoAuthResponse(c.req.raw, denied);
  }

  const res = await auth.handler(c.req.raw);
  return mergeCorsIntoAuthResponse(c.req.raw, res);
});

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
