import { Hono } from "hono";

export const defaultRouter = new Hono();

defaultRouter.get("/", (c) => c.json({ message: "Hello, World!" }));
