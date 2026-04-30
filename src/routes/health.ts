import { Hono } from "hono";

const healthRouter = new Hono();

healthRouter.get("/", (c) => c.json({ message: "OK" }));

export default healthRouter;
