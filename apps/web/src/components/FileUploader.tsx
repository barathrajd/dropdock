import { useState, useRef } from "react";
import { api, type Destination } from "../lib/api";
import {
  UploadCloud,
  FolderOpen,
  FileVideo,
  FileImage,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface FileUploaderProps {
  destination: Destination;
  currentPath: string;
  onPathChange: (path: string) => void;
  onUploadComplete: () => void;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("video/")) return <FileVideo className="w-5 h-5 text-indigo-400" />;
  if (type.startsWith("image/")) return <FileImage className="w-5 h-5 text-amber-400" />;
  return <FileIcon className="w-5 h-5 text-slate-400" />;
};

export function FileUploader({
  destination,
  currentPath,
  onPathChange,
  onUploadComplete,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      progress: 0,
      status: "pending",
    }));

    setQueue((prev) => [...prev, ...newItems]);
    // Automatically trigger upload
    newItems.forEach((item) => startUpload(item));
  };

  const startUpload = async (item: UploadQueueItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 0 } : q))
    );

    try {
      // 1. Get presigned URL from backend
      const presigned = await api.presignUpload(destination.id, {
        fileName: item.file.name,
        contentType: item.file.type || "application/octet-stream",
        pathPrefix: currentPath,
      });

      // 2. Direct upload to S3/R2/MinIO
      await api.uploadDirectToStorage(presigned.uploadUrl, item.file, (percent) => {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
        );
      });

      // 3. Mark success
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "success", progress: 100 } : q))
      );
      onUploadComplete();
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: "error", errorMessage: err.message || "Upload failed" }
            : q
        )
      );
    }
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Path Input Field */}
      <div className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
        <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
        <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
          Upload Destination Path:
        </label>
        <div className="relative flex-1">
          <input
            type="text"
            value={currentPath}
            onChange={(e) => onPathChange(e.target.value)}
            placeholder="e.g. videos/tutorials/ or images/banners/ (leave empty for root)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
          />
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Bucket: <strong className="text-slate-300">{destination.bucket}</strong>
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            addFilesToQueue(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? "border-sky-500 bg-sky-500/10 scale-[1.005]"
            : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFilesToQueue(e.target.files);
            }
          }}
        />

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-3">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-sm font-semibold text-white tracking-tight">
          Click or drag & drop files here to upload
        </h3>
        <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
          Videos (.mp4, .mov, .webm), Images (.png, .jpg, .webp, .svg), or any documents. Direct
          browser-to-storage stream.
        </p>
      </div>

      {/* Upload Queue Listing */}
      {queue.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Upload Queue ({queue.length})</span>
            <button
              onClick={() => setQueue([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl"
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {getFileIcon(item.file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white truncate">
                      {item.file.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {formatSize(item.file.size)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        item.status === "success"
                          ? "bg-emerald-500"
                          : item.status === "error"
                          ? "bg-rose-500"
                          : "bg-sky-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {item.errorMessage && (
                    <span className="text-[10px] text-rose-400 mt-1 block">
                      {item.errorMessage}
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  )}
                  {item.status === "success" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {item.status === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
