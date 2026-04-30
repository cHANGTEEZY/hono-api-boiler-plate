import { app } from "./app";
import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "./config/env";
import { logger } from "./lib/logger";

const server = Bun.serve({
  fetch: app.fetch,
  hostname: env.HOST,
  port: env.PORT,
  idleTimeout: 30, //? 30 seconds
});

logger.info(
  {
    url: server.url.toString(),
    environment: env.NODE_ENV,
    corsCredentials: corsCredentialsEnabled,
    corsOrigins:
      env.CORS_ORIGIN.trim() === "*" ? "*" : trustedFrontendOrigins.length,
    frontendOrigin: env.FRONTEND_ORIGIN,
  },
  "server listening",
);

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "graceful shutdown started");

  try {
    await server.stop(true);
    logger.info("server stopped");
    process.exit(0);
  } catch (error) {
    logger.error({ error, signal }, "graceful shutdown failed");
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "uncaught exception");
  void shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  void shutdown("unhandledRejection");
});
