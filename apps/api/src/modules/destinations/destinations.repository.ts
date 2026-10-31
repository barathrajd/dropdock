import { eq, desc } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { randomUUID } from "crypto";
import { destinations, type Destination } from "../../db/schema";
import { encryptSecret, decryptSecret } from "../../lib/crypto";

export interface CreateDestinationInput {
  name: string;
  provider?: string;
  endpoint?: string;
  region?: string;
  bucket: string;
  pathPrefix?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
  isDefault?: boolean;
}

export interface DestinationPublic {
  id: string;
  name: string;
  provider: string;
  endpoint?: string | null;
  region: string;
  bucket: string;
  pathPrefix?: string | null;
  accessKeyId: string;
  publicBaseUrl?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DestinationWithCredentials extends DestinationPublic {
  secretAccessKey: string;
}

export class DestinationsRepository {
  constructor(
    private db: BunSQLiteDatabase<any>,
    private masterKey: string
  ) {}

  private toPublic(row: Destination): DestinationPublic {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      endpoint: row.endpoint,
      region: row.region,
      bucket: row.bucket,
      pathPrefix: row.pathPrefix,
      accessKeyId: row.accessKeyId,
      publicBaseUrl: row.publicBaseUrl,
      isDefault: Boolean(row.isDefault),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(input: CreateDestinationInput): Promise<DestinationPublic> {
    const now = new Date();
    const id = randomUUID();
    const secretEncrypted = encryptSecret(input.secretAccessKey, this.masterKey);

    if (input.isDefault) {
      // Unset any previous default
      await this.db
        .update(destinations)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(destinations.isDefault, true));
    }

    const [row] = await this.db
      .insert(destinations)
      .values({
        id,
        name: input.name,
        provider: input.provider || "s3",
        endpoint: input.endpoint?.replace(/\/$/, "") || null,
        region: input.region || "us-east-1",
        bucket: input.bucket,
        pathPrefix: input.pathPrefix?.replace(/^\/+|\/+$/g, "") || null,
        accessKeyId: input.accessKeyId,
        secretAccessKeyEncrypted: secretEncrypted,
        publicBaseUrl: input.publicBaseUrl?.replace(/\/$/, "") || null,
        isDefault: Boolean(input.isDefault),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.toPublic(row);
  }

  async list(): Promise<DestinationPublic[]> {
    const rows = await this.db
      .select()
      .from(destinations)
      .orderBy(desc(destinations.isDefault), desc(destinations.createdAt));
    return rows.map((r) => this.toPublic(r));
  }

  async getById(id: string): Promise<DestinationPublic | null> {
    const rows = await this.db.select().from(destinations).where(eq(destinations.id, id));
    if (!rows[0]) return null;
    return this.toPublic(rows[0]);
  }

  async getByIdWithCredentials(id: string): Promise<DestinationWithCredentials | null> {
    const rows = await this.db.select().from(destinations).where(eq(destinations.id, id));
    if (!rows[0]) return null;
    const row = rows[0];
    const decrypted = decryptSecret(row.secretAccessKeyEncrypted, this.masterKey);
    return {
      ...this.toPublic(row),
      secretAccessKey: decrypted,
    };
  }

  async setDefault(id: string): Promise<void> {
    const now = new Date();
    // Unset all defaults
    await this.db.update(destinations).set({ isDefault: false, updatedAt: now });
    // Set target default
    await this.db.update(destinations).set({ isDefault: true, updatedAt: now }).where(eq(destinations.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(destinations).where(eq(destinations.id, id)).returning();
    return result.length > 0;
  }
}
