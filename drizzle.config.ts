import { defineConfig } from "drizzle-kit";

// With `pg` installed, drizzle-kit uses it for CLI. Without `pg`, Neon URLs use
// `@neondatabase/serverless` and `migrate`/`push` often fail. For Neon, set
// DATABASE_URL_UNPOOLED (direct / non-pooled) for migrations.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Set DATABASE_URL (and optionally DATABASE_URL_UNPOOLED for Neon migrations)",
  );
}

/** Neon copy-paste URLs often include `channel_binding=require`; node-pg commonly fails on it. */
function urlForPgCli(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: ["src/db/schema/index.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: urlForPgCli(migrationUrl),
  },
});
