import axios from "axios";

export interface Destination {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateDestinationPayload {
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

export interface StorageFile {
  key: string;
  name: string;
  size: number;
  lastModified?: string;
  isFolder: boolean;
  url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = {
  async getDestinations(): Promise<Destination[]> {
    const res = await axios.get<Destination[]>(`${API_BASE}/destinations`);
    return res.data;
  },

  async createDestination(payload: CreateDestinationPayload): Promise<Destination> {
    const res = await axios.post<Destination>(`${API_BASE}/destinations`, payload);
    return res.data;
  },

  async verifyDestination(id: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const res = await axios.post(`${API_BASE}/destinations/${id}/verify`);
    return res.data;
  },

  async setDefaultDestination(id: string): Promise<{ success: boolean }> {
    const res = await axios.post(`${API_BASE}/destinations/${id}/default`);
    return res.data;
  },

  async deleteDestination(id: string): Promise<{ success: boolean }> {
    const res = await axios.delete(`${API_BASE}/destinations/${id}`);
    return res.data;
  },

  async presignUpload(
    destinationId: string,
    params: { fileName: string; contentType: string; pathPrefix?: string }
  ): Promise<{ uploadUrl: string; key: string; method: "PUT" }> {
    const res = await axios.post(`${API_BASE}/destinations/${destinationId}/presign-upload`, params);
    return res.data;
  },

  async uploadDirectToStorage(
    uploadUrl: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  async listFiles(destinationId: string, prefix = ""): Promise<{ files: StorageFile[]; nextCursor?: string }> {
    const res = await axios.get(`${API_BASE}/destinations/${destinationId}/files`, {
      params: { prefix },
    });
    return res.data;
  },

  async presignDownload(destinationId: string, key: string, downloadAs?: string): Promise<{ downloadUrl: string }> {
    const res = await axios.post(`${API_BASE}/destinations/${destinationId}/presign-download`, {
      key,
      downloadAs,
    });
    return res.data;
  },

  async deleteFile(destinationId: string, key: string): Promise<{ success: boolean }> {
    const res = await axios.delete(`${API_BASE}/destinations/${destinationId}/files`, {
      data: { key },
    });
    return res.data;
  },
};
