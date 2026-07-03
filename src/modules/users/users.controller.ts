import type { Context } from "hono";
import { ajApi } from "../../shared/utils/arcjet";
import { handleArcjetDecision } from "../../shared/utils/arcjet-deny";
import type { AppVariables } from "../../shared/types/app.types";
import { usersService } from "./users.service";

type UsersContext = Context<{ Variables: AppVariables }>;

export const usersController = {
  async getMe(c: UsersContext) {
    const decision = await ajApi.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
    const denied = handleArcjetDecision(c, decision);
    if (denied) return denied;

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          requestId: c.get("requestId"),
        },
        401,
      );
    }

    const profile = await usersService.getProfile(currentUser.id);
    if (!profile) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          requestId: c.get("requestId"),
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: profile,
      requestId: c.get("requestId"),
    });
  },
};
