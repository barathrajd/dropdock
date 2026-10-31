import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const destinations = sqliteTable("destinations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull().default("s3"),
  endpoint: text("endpoint"),
  region: text("region").notNull().default("us-east-1"),
  bucket: text("bucket").notNull(),
  pathPrefix: text("path_prefix"),
  accessKeyId: text("access_key_id").notNull(),
  secretAccessKeyEncrypted: text("secret_access_key_encrypted").notNull(),
  publicBaseUrl: text("public_base_url"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Destination = typeof destinations.$inferSelect;
export type NewDestination = typeof destinations.$inferInsert;
