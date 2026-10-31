import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  ConnectionVerificationResult,
  PresignedPutResult,
  ListFilesResult,
  StorageFile,
} from "./types";

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string | null;
  forcePathStyle?: boolean;
  publicBaseUrl?: string | null;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  public readonly bucket: string;
  public readonly region: string;
  public readonly publicBaseUrl?: string | null;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region || "us-east-1";
    this.publicBaseUrl = config.publicBaseUrl;

    const endpoint = config.endpoint || undefined;
    const forcePathStyle =
      config.forcePathStyle !== undefined
        ? config.forcePathStyle
        : Boolean(endpoint && !endpoint.includes("amazonaws.com"));

    this.client = new S3Client({
      region: this.region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async verifyConnection(): Promise<ConnectionVerificationResult> {
    const start = performance.now();
    try {
      // List 1 object to test both connectivity and bucket permissions
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 1,
        })
      );
      const latencyMs = Math.round(performance.now() - start);
      return { success: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        latencyMs,
        error: err.message || "Failed to connect to S3 storage bucket",
      };
    }
  }

  async createPresignedPutUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedPutResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds || 3600,
    });

    return {
      uploadUrl,
      key: params.key,
      method: "PUT",
    };
  }

  async createPresignedGetUrl(params: {
    key: string;
    expiresInSeconds?: number;
    downloadAs?: string;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ResponseContentDisposition: params.downloadAs
        ? `attachment; filename="${encodeURIComponent(params.downloadAs)}"`
        : undefined,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds || 3600,
    });
  }

  async listFiles(params: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ListFilesResult> {
    const cleanPrefix = params.prefix ? params.prefix.replace(/^\/+/, "") : "";
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: cleanPrefix,
      Delimiter: "/",
      ContinuationToken: params.cursor,
      MaxKeys: params.limit || 100,
    });

    const response = await this.client.send(command);

    const files: StorageFile[] = [];

    // CommonPrefixes represent subdirectories/folders
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (!prefix.Prefix) continue;
        const name = prefix.Prefix.slice(cleanPrefix.length).replace(/\/$/, "");
        files.push({
          key: prefix.Prefix,
          name,
          size: 0,
          isFolder: true,
        });
      }
    }

    // Contents represent actual files
    if (response.Contents) {
      for (const item of response.Contents) {
        if (!item.Key || item.Key === cleanPrefix || item.Key.endsWith("/")) continue;
        const name = item.Key.slice(cleanPrefix.length);

        let directUrl: string | undefined;
        if (this.publicBaseUrl) {
          directUrl = `${this.publicBaseUrl.replace(/\/$/, "")}/${item.Key
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`;
        }

        files.push({
          key: item.Key,
          name,
          size: item.Size || 0,
          lastModified: item.LastModified,
          isFolder: false,
          url: directUrl,
        });
      }
    }

    return {
      files,
      nextCursor: response.NextContinuationToken,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}
