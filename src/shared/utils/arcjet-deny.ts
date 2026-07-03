import type { ArcjetDecision } from "@arcjet/bun";
import type { Context } from "hono";
import type { AppVariables } from "../types/app.types";
import { logger } from "./logger";

function statusForDecision(decision: ArcjetDecision): 400 | 403 | 429 {
  if (decision.reason.isRateLimit()) return 429;
  if (
    decision.reason.isEmail() ||
    decision.reason.isSensitiveInfo() ||
    decision.reason.isPromptInjection()
  ) {
    return 400;
  }
  return 403;
}

function codeForDecision(decision: ArcjetDecision): string {
  if (decision.reason.isRateLimit()) return "RATE_LIMITED";
  if (decision.reason.isEmail()) return "INVALID_EMAIL";
  if (decision.reason.isSensitiveInfo()) return "SENSITIVE_INFO";
  if (decision.reason.isPromptInjection()) return "PROMPT_INJECTION";
  if (decision.reason.isBot()) return "BOT_DETECTED";
  return "FORBIDDEN";
}

export function handleArcjetDecision(
  c: Context<{ Variables: AppVariables }>,
  decision: ArcjetDecision,
) {
  if (decision.isErrored()) {
    logger.warn(
      {
        requestId: c.get("requestId"),
        path: new URL(c.req.url).pathname,
        conclusion: decision.conclusion,
        reason: decision.reason,
      },
      "arcjet errored and failed open",
    );
    return null;
  }

  if (!decision.isDenied()) {
    return null;
  }

  const status = statusForDecision(decision);

  return c.json(
    {
      success: false,
      error: {
        code: codeForDecision(decision),
        message:
          status === 429
            ? "Too many requests"
            : "Request blocked by security policy",
      },
      requestId: c.get("requestId"),
    },
    status,
  );
}
