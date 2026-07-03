import { Hono } from "hono";
import { healthRoutes } from "./health/health.routes";
import { usersRoutes } from "./users/users.routes";

export const apiV1Router = new Hono();

apiV1Router.route("/health", healthRoutes);
apiV1Router.route("/users", usersRoutes);
