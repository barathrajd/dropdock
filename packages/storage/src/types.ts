export interface ConnectionVerificationResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

export interface PresignedPutResult {
  uploadUrl: string;
  key: string;
  method: "PUT";
  headers?: Record<string, string>;
}

export interface StorageFile {
  key: string;
  name: string;
  size: number;
  lastModified?: Date;
  contentType?: string;
  isFolder: boolean;
  url?: string;
}

export interface ListFilesResult {
  files: StorageFile[];
  nextCursor?: string;
}

export interface StorageProvider {
  verifyConnection(): Promise<ConnectionVerificationResult>;
  createPresignedPutUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedPutResult>;
  createPresignedGetUrl(params: {
    key: string;
    expiresInSeconds?: number;
    downloadAs?: string;
  }): Promise<string>;
  listFiles(params: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ListFilesResult>;
  deleteFile(key: string): Promise<void>;
}
