import { resolver } from "hono-openapi";
import { z } from "zod";

export const healthTags = ["Health"];

export const healthOkSchema = z.object({
  message: z.string(),
});

export const healthDocs = {
  getHealth: {
    tags: healthTags,
    summary: "Health check",
    description: "Returns service health status. Used by load balancers and Docker.",
    responses: {
      200: {
        description: "Service is healthy",
        content: {
          "application/json": {
            schema: resolver(healthOkSchema),
          },
        },
      },
      429: {
        description: "Rate limited by Arcjet",
      },
    },
  },
};
