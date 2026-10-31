import { config } from "./config/env";
import { app } from "./app";
export { destinationsRepo } from "./modules/destinations/repo";

export default {
  port: config.port,
  fetch: app.fetch,
};
