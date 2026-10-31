import { db } from "../../db";
import { config } from "../../config/env";
import { DestinationsRepository } from "./destinations.repository";

export const destinationsRepo = new DestinationsRepository(db, config.masterKey);
