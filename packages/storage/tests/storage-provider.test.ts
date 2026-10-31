import { describe, expect, it } from "bun:test";
import { S3StorageProvider } from "../src/s3-provider";

describe("S3StorageProvider (M2)", () => {
  it("initializes with configuration correctly", () => {
    const provider = new S3StorageProvider({
      bucket: "test-bucket",
      region: "us-east-1",
      accessKeyId: "mock-key",
      secretAccessKey: "mock-secret",
      endpoint: "http://localhost:9000",
      forcePathStyle: true,
    });

    expect(provider.bucket).toBe("test-bucket");
    expect(provider.region).toBe("us-east-1");
  });

  it("handles failed connection verification gracefully without throwing uncaught error", async () => {
    const provider = new S3StorageProvider({
      bucket: "non-existent-bucket-xyz",
      region: "us-east-1",
      accessKeyId: "invalid-key",
      secretAccessKey: "invalid-secret",
      endpoint: "http://127.0.0.1:59999", // Unreachable endpoint
    });

    const result = await provider.verifyConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
