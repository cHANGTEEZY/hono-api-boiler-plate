import { Hono } from "hono";
import { defaultRouter } from "./hello";

export const apiV1Router = new Hono();

apiV1Router.route("/hello", defaultRouter);
