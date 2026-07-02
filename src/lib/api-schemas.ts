import { z } from "zod";

export const rootOkSchema = z.object({
  message: z.string(),
});
