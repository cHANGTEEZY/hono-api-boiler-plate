import arcjet, { protectSignup, shield, slidingWindow } from "@arcjet/bun";
import { env } from "../../config/env";

export const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [shield({ mode: "LIVE" })],
});

export const ajApi = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: 60,
    max: 100,
  }),
);

export const ajAuth = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: 60,
    max: 30,
  }),
);

export const ajAuthSignup = aj.withRule(
  protectSignup({
    email: {
      mode: "LIVE",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    },
    bots: {
      mode: "LIVE",
      allow: [],
    },
    rateLimit: {
      mode: "LIVE",
      interval: "10m",
      max: 5,
    },
  }),
);
