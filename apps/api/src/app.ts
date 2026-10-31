import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { destinationsRouter } from "./modules/destinations/destinations.router";

export const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "@dropdock/api",
  });
});

app.route("/api/destinations", destinationsRouter);
