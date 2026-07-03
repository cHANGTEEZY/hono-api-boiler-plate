import { resolver } from "hono-openapi";
import { z } from "zod";
import { signInSchema, signUpSchema } from "./auth.validator";

export const authTags = ["Auth"];

export const sessionResponseSchema = z.object({
  session: z.record(z.string(), z.unknown()).nullable(),
  user: z.record(z.string(), z.unknown()).nullable(),
});

export const authErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  requestId: z.string(),
});

export const authDocs = {
  signUp: {
    tags: authTags,
    summary: "Sign up with email and password",
    description:
      "Creates a new user account via Better Auth. Proxied to `/api/auth/sign-up/email`.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: resolver(signUpSchema),
        },
      },
    },
    responses: {
      200: {
        description: "User created and session established",
      },
      400: {
        description: "Invalid email or validation error",
        content: {
          "application/json": {
            schema: resolver(authErrorSchema),
          },
        },
      },
      429: {
        description: "Rate limited or signup abuse blocked",
        content: {
          "application/json": {
            schema: resolver(authErrorSchema),
          },
        },
      },
    },
  },
  signIn: {
    tags: authTags,
    summary: "Sign in with email and password",
    description:
      "Authenticates a user via Better Auth. Proxied to `/api/auth/sign-in/email`.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: resolver(signInSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Session established",
      },
      401: {
        description: "Invalid credentials",
      },
      429: {
        description: "Too many auth attempts",
        content: {
          "application/json": {
            schema: resolver(authErrorSchema),
          },
        },
      },
    },
  },
  getSession: {
    tags: authTags,
    summary: "Get current session",
    description: "Returns the active Better Auth session for the request cookies.",
    responses: {
      200: {
        description: "Session payload",
        content: {
          "application/json": {
            schema: resolver(sessionResponseSchema),
          },
        },
      },
    },
  },
};
