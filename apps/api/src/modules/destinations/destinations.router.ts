import { Hono } from "hono";
import { z } from "zod";
import { randomUUID } from "crypto";
import { destinationsRepo } from "./repo";
import { S3StorageProvider } from "@dropdock/storage";

export const destinationsRouter = new Hono();

const createDestinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().default("s3"),
  endpoint: z.string().optional().nullable(),
  region: z.string().default("us-east-1"),
  bucket: z.string().min(1, "Bucket name is required"),
  pathPrefix: z.string().optional().nullable(),
  accessKeyId: z.string().min(1, "Access key ID is required"),
  secretAccessKey: z.string().min(1, "Secret access key is required"),
  publicBaseUrl: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

const presignUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().default("application/octet-stream"),
  pathPrefix: z.string().optional().nullable(),
});

const deleteFileSchema = z.object({
  key: z.string().min(1, "Object key is required"),
});

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

// GET /api/destinations
destinationsRouter.get("/", async (c) => {
  const list = await destinationsRepo.list();
  return c.json(list);
});

// GET /api/destinations/:id
destinationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getById(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }
  return c.json(destination);
});

// POST /api/destinations
destinationsRouter.post("/", async (c) => {
  try {
    const rawBody = await c.req.json();
    const parsed = createDestinationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const created = await destinationsRepo.create(parsed.data as any);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/destinations/:id/verify
destinationsRouter.post("/:id/verify", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getByIdWithCredentials(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }

  const provider = new S3StorageProvider({
    bucket: destination.bucket,
    region: destination.region,
    endpoint: destination.endpoint,
    accessKeyId: destination.accessKeyId,
    secretAccessKey: destination.secretAccessKey,
    publicBaseUrl: destination.publicBaseUrl,
  });

  const result = await provider.verifyConnection();
  return c.json(result);
});

// POST /api/destinations/:id/default
destinationsRouter.post("/:id/default", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getById(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }
  await destinationsRepo.setDefault(id);
  return c.json({ success: true });
});

// DELETE /api/destinations/:id
destinationsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const success = await destinationsRepo.delete(id);
  return c.json({ success });
});

// POST /api/destinations/:id/presign-upload
destinationsRouter.post("/:id/presign-upload", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getByIdWithCredentials(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }

  const rawBody = await c.req.json();
  const parsed = presignUploadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  const folder = (parsed.data.pathPrefix ?? destination.pathPrefix ?? "").replace(/^\/+|\/+$/g, "");
  const safeName = sanitizeFilename(parsed.data.fileName);
  const key = folder ? `${folder}/${randomUUID()}-${safeName}` : `${randomUUID()}-${safeName}`;

  const provider = new S3StorageProvider({
    bucket: destination.bucket,
    region: destination.region,
    endpoint: destination.endpoint,
    accessKeyId: destination.accessKeyId,
    secretAccessKey: destination.secretAccessKey,
    publicBaseUrl: destination.publicBaseUrl,
  });

  try {
    const result = await provider.createPresignedPutUrl({
      key,
      contentType: parsed.data.contentType,
      expiresInSeconds: 3600,
    });
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/destinations/:id/files
destinationsRouter.get("/:id/files", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getByIdWithCredentials(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }

  const prefix = c.req.query("prefix") || destination.pathPrefix || "";
  const cursor = c.req.query("cursor") || undefined;
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : 100;

  const provider = new S3StorageProvider({
    bucket: destination.bucket,
    region: destination.region,
    endpoint: destination.endpoint,
    accessKeyId: destination.accessKeyId,
    secretAccessKey: destination.secretAccessKey,
    publicBaseUrl: destination.publicBaseUrl,
  });

  try {
    const result = await provider.listFiles({ prefix, cursor, limit });
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/destinations/:id/presign-download
destinationsRouter.post("/:id/presign-download", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getByIdWithCredentials(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }

  const { key, downloadAs } = await c.req.json();
  if (!key) {
    return c.json({ error: "Key is required" }, 400);
  }

  const provider = new S3StorageProvider({
    bucket: destination.bucket,
    region: destination.region,
    endpoint: destination.endpoint,
    accessKeyId: destination.accessKeyId,
    secretAccessKey: destination.secretAccessKey,
    publicBaseUrl: destination.publicBaseUrl,
  });

  try {
    const downloadUrl = await provider.createPresignedGetUrl({ key, downloadAs });
    return c.json({ downloadUrl });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/destinations/:id/files
destinationsRouter.delete("/:id/files", async (c) => {
  const id = c.req.param("id");
  const destination = await destinationsRepo.getByIdWithCredentials(id);
  if (!destination) {
    return c.json({ error: "Destination not found" }, 404);
  }

  const rawBody = await c.req.json();
  const parsed = deleteFileSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  const provider = new S3StorageProvider({
    bucket: destination.bucket,
    region: destination.region,
    endpoint: destination.endpoint,
    accessKeyId: destination.accessKeyId,
    secretAccessKey: destination.secretAccessKey,
    publicBaseUrl: destination.publicBaseUrl,
  });

  try {
    await provider.deleteFile(parsed.data.key);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
