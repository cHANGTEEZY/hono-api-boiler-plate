import { z } from "zod";

/** Common local SPA ports (Vite default 5173; some setups use 3000). */
const LOCAL_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development")
    .transform((val) =>
      val === "production"
        ? "production"
        : val === "test"
          ? "test"
          : "development",
    ),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.string().default("*"),
  FRONTEND_ORIGIN: z.string(),
});

const raw = envSchema.parse(process.env);

function normalizeOrigin(url: string): string {
  let u = url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/$/, "");
  if (u === "*") return "*";
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) {
    u = `http://${u}`;
  }
  return u;
}

export const trustedFrontendOrigins: string[] = (() => {
  if (normalizeOrigin(raw.CORS_ORIGIN) === "*") {
    return [...LOCAL_DEV_ORIGINS];
  }
  const fromEnv = raw.CORS_ORIGIN.split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  return [...new Set([...LOCAL_DEV_ORIGINS, ...fromEnv])];
})();

export const corsCredentialsEnabled = normalizeOrigin(raw.CORS_ORIGIN) !== "*";

export const env = raw;

export function getEmailVerificationCallbackUrl(): string {
  const fromEnv = env.FRONTEND_ORIGIN?.replace(/\/$/, "");
  if (fromEnv) {
    return `${fromEnv}/`;
  }
  const trust = trustedFrontendOrigins[0];
  return trust ? `${trust}/` : "http://localhost:5173/";
}
