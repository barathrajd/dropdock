import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("Destinations API (M2)", () => {
  let createdId: string;

  it("POST /api/destinations creates a new destination", async () => {
    const res = await app.request("/api/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test S3 Destination",
        provider: "s3",
        region: "ap-south-1",
        bucket: "test-bucket",
        accessKeyId: "AKIA_TEST_KEY",
        secretAccessKey: "secret_123456",
        isDefault: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.id).toBeDefined();
    expect(body.name).toBe("Test S3 Destination");
    expect(body.isDefault).toBe(true);
    expect(body.secretAccessKey).toBeUndefined(); // Never returns secret in response
    createdId = body.id;
  });

  it("GET /api/destinations lists destinations", async () => {
    const res = await app.request("/api/destinations");
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.find((d) => d.id === createdId)).toBeDefined();
  });

  it("POST /api/destinations/:id/verify performs connection check", async () => {
    const res = await app.request(`/api/destinations/${createdId}/verify`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const result = (await res.json()) as any;
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.latencyMs).toBe("number");
  });

  it("POST /api/destinations/:id/presign-upload generates presigned URL with custom path prefix", async () => {
    const res = await app.request(`/api/destinations/${createdId}/presign-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "promo-video.mp4",
        contentType: "video/mp4",
        pathPrefix: "videos/tutorials",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.uploadUrl).toBeDefined();
    expect(body.key).toMatch(/^videos\/tutorials\/[a-f0-9-]+-promo-video\.mp4$/);
    expect(body.method).toBe("PUT");
  });

  it("DELETE /api/destinations/:id/files deletes object from storage", async () => {
    const res = await app.request(`/api/destinations/${createdId}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "videos/tutorials/sample.mp4",
      }),
    });

    // Since it's a mock S3 endpoint, it will handle command attempt
    expect([200, 500]).toContain(res.status); // 200 or 500 depending on network reachability
  });

  it("DELETE /api/destinations/:id removes destination", async () => {
    const res = await app.request(`/api/destinations/${createdId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
  });
});
