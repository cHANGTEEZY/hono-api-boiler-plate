import type { Context } from "hono";
import {
  ajAuth,
  ajAuthSignup,
} from "../../shared/utils/arcjet";
import { handleArcjetDecision } from "../../shared/utils/arcjet-deny";
import { mergeCorsIntoAuthResponse } from "../../shared/utils/cors-merge";
import type { AppVariables } from "../../shared/types/app.types";
import { auth } from "./auth.service";
import { authSignupBodySchema } from "./auth.validator";

type AuthContext = Context<{ Variables: AppVariables }>;

export const authController = {
  async handleAuthRequest(c: AuthContext) {
    const pathname = new URL(c.req.url).pathname;
    const isSignup = pathname.includes("/sign-up");

    let decision;
    if (isSignup && c.req.method === "POST") {
      let email: string | undefined;
      try {
        const body = authSignupBodySchema.parse(
          await c.req.raw.clone().json(),
        );
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
  },
};
