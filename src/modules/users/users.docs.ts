import { resolver } from "hono-openapi";
import { z } from "zod";
import { publicUserSchema } from "./users.validator";

export const usersTags = ["Users"];

export const userProfileResponseSchema = z.object({
  success: z.literal(true),
  data: publicUserSchema,
  requestId: z.string(),
});

export const usersErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  requestId: z.string(),
});

export const usersDocs = {
  getMe: {
    tags: usersTags,
    summary: "Get current user profile",
    description: "Returns the authenticated user's profile from the database.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: "Current user profile",
        content: {
          "application/json": {
            schema: resolver(userProfileResponseSchema),
          },
        },
      },
      401: {
        description: "Not authenticated",
        content: {
          "application/json": {
            schema: resolver(usersErrorSchema),
          },
        },
      },
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: resolver(usersErrorSchema),
          },
        },
      },
    },
  },
};
