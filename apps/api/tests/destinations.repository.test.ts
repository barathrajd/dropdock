import { describe, expect, it, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { destinations } from "../src/db/schema";
import { encryptSecret, decryptSecret } from "../src/lib/crypto";
import { DestinationsRepository } from "../src/modules/destinations/destinations.repository";

describe("Destinations Data Layer (M1)", () => {
  const masterKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 32-byte hex

  it("encrypts and decrypts secret keys symmetrically", () => {
    const rawSecret = "superSecretAccessKey123!@#";
    const encrypted = encryptSecret(rawSecret, masterKey);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.includes(":")).toBe(true); // iv:authTag:ciphertext

    const decrypted = decryptSecret(encrypted, masterKey);
    expect(decrypted).toBe(rawSecret);
  });

  describe("DestinationsRepository", () => {
    let sqlite: Database;
    let repo: DestinationsRepository;

    beforeEach(() => {
      sqlite = new Database(":memory:");
      // Create schema table in memory
      sqlite.run(`
        CREATE TABLE destinations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 's3',
          endpoint TEXT,
          region TEXT NOT NULL DEFAULT 'us-east-1',
          bucket TEXT NOT NULL,
          path_prefix TEXT,
          access_key_id TEXT NOT NULL,
          secret_access_key_encrypted TEXT NOT NULL,
          public_base_url TEXT,
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      const db = drizzle(sqlite, { schema: { destinations } });
      repo = new DestinationsRepository(db, masterKey);
    });

    it("creates a destination with encrypted secret and retrieves it safely", async () => {
      const created = await repo.create({
        name: "Production S3",
        provider: "s3",
        region: "ap-south-2",
        bucket: "my-production-bucket",
        accessKeyId: "AKIA1234567890",
        secretAccessKey: "secret-key-to-protect",
        publicBaseUrl: "https://cdn.example.com",
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Production S3");
      expect(created.bucket).toBe("my-production-bucket");

      // Verify that in the raw database the secret is NOT plaintext
      const rawRow = sqlite.query("SELECT secret_access_key_encrypted FROM destinations WHERE id = ?").get(created.id) as { secret_access_key_encrypted: string };
      expect(rawRow.secret_access_key_encrypted).not.toBe("secret-key-to-protect");

      // Verify repo returns decrypted secret when fetching by id with credentials
      const destinationWithCreds = await repo.getByIdWithCredentials(created.id);
      expect(destinationWithCreds).not.toBeNull();
      expect(destinationWithCreds?.secretAccessKey).toBe("secret-key-to-protect");
    });

    it("lists destinations with masked secrets", async () => {
      await repo.create({
        name: "MinIO Local",
        provider: "s3",
        endpoint: "http://localhost:9000",
        region: "us-east-1",
        bucket: "local-bucket",
        accessKeyId: "minioadmin",
        secretAccessKey: "minioadmin123",
      });

      const list = await repo.list();
      expect(list.length).toBe(1);
      expect(list[0].name).toBe("MinIO Local");
      // Public safe listing should never expose the raw secret
      expect((list[0] as any).secretAccessKey).toBeUndefined();
    });

    it("sets a destination as default and unsets prior default", async () => {
      const d1 = await repo.create({
        name: "Dest 1",
        provider: "s3",
        bucket: "b1",
        accessKeyId: "ak1",
        secretAccessKey: "sk1",
        isDefault: true,
      });

      const d2 = await repo.create({
        name: "Dest 2",
        provider: "s3",
        bucket: "b2",
        accessKeyId: "ak2",
        secretAccessKey: "sk2",
        isDefault: false,
      });

      let list = await repo.list();
      expect(list.find(d => d.id === d1.id)?.isDefault).toBe(true);
      expect(list.find(d => d.id === d2.id)?.isDefault).toBe(false);

      await repo.setDefault(d2.id);

      list = await repo.list();
      expect(list.find(d => d.id === d1.id)?.isDefault).toBe(false);
      expect(list.find(d => d.id === d2.id)?.isDefault).toBe(true);
    });
  });
});
