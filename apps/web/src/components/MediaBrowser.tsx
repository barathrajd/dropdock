import { useState, useEffect } from "react";
import { api, type Destination, type StorageFile } from "../lib/api";
import { Dialog } from "./ui/Dialog";
import {
  Folder,
  FileVideo,
  FileImage,
  FileText,
  Download,
  Trash2,
  Play,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  HardDrive,
} from "lucide-react";

interface MediaBrowserProps {
  destination: Destination;
  currentPath: string;
  onNavigate: (newPath: string) => void;
  refreshTrigger: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "--";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isVideo = (name: string) => /\.(mp4|webm|mov|mkv|avi)$/i.test(name);
const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

export function MediaBrowser({
  destination,
  currentPath,
  onNavigate,
  refreshTrigger,
}: MediaBrowserProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "image" | "doc">("all");

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<{
    file: StorageFile;
    url: string;
  } | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await api.listFiles(destination.id, currentPath);
      setFiles(data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [destination.id, currentPath, refreshTrigger]);

  const handleOpenPreview = async (file: StorageFile) => {
    try {
      // If direct publicBaseUrl is available, use it; otherwise get a presigned URL
      let url = file.url;
      if (!url) {
        const presigned = await api.presignDownload(destination.id, file.key);
        url = presigned.downloadUrl;
      }
      setPreviewFile({ file, url });
    } catch (err) {
      console.error("Failed to load preview URL", err);
    }
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const presigned = await api.presignDownload(destination.id, file.key, file.name);
      const a = document.createElement("a");
      a.href = presigned.downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download file", err);
    }
  };

  const handleDelete = async (file: StorageFile) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.name}"?`)) return;
    try {
      await api.deleteFile(destination.id, file.key);
      fetchFiles();
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  // Breadcrumbs
  const pathSegments = currentPath.split("/").filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      onNavigate("");
    } else {
      const newPath = pathSegments.slice(0, index + 1).join("/");
      onNavigate(newPath);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (typeFilter === "video") return f.isFolder || isVideo(f.name);
    if (typeFilter === "image") return f.isFolder || isImage(f.name);
    if (typeFilter === "doc") return f.isFolder || (!isVideo(f.name) && !isImage(f.name));
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Explorer Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center gap-1 hover:text-white transition px-1.5 py-1 rounded bg-slate-900 border border-slate-800"
          >
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>root</span>
          </button>

          {pathSegments.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`hover:text-white transition px-1.5 py-1 rounded ${
                  idx === pathSegments.length - 1
                    ? "text-sky-400 font-semibold bg-sky-500/10 border border-sky-500/20"
                    : "bg-slate-900 border border-slate-800"
                }`}
              >
                {segment}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded ${
                typeFilter === "all" ? "bg-sky-500 text-white font-medium" : "text-slate-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("video")}
              className={`px-2.5 py-1 rounded ${
                typeFilter === "video" ? "bg-sky-500 text-white font-medium" : "text-slate-400"
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setTypeFilter("image")}
              className={`px-2.5 py-1 rounded ${
                typeFilter === "image" ? "bg-sky-500 text-white font-medium" : "text-slate-400"
              }`}
            >
              Images
            </button>
          </div>

          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh files"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs">Loading objects from storage...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
          <p className="text-sm font-medium">No files or folders found in this path</p>
          <p className="text-xs text-slate-600 mt-1">Upload files using the drag-and-drop zone above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredFiles.map((file) => {
            const video = isVideo(file.name);
            const image = isImage(file.name);

            if (file.isFolder) {
              return (
                <div
                  key={file.key}
                  onClick={() => onNavigate(file.key.replace(/\/$/, ""))}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-sky-500/40 transition cursor-pointer group"
                >
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 fill-amber-400/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white group-hover:text-sky-400 transition truncate block">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Folder
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={file.key}
                className="group relative flex flex-col justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition"
              >
                {/* Media Icon & Name */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => (video || image ? handleOpenPreview(file) : handleDownload(file))}
                    className={`p-2.5 rounded-lg cursor-pointer transition ${
                      video
                        ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                        : image
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {video ? (
                      <FileVideo className="w-5 h-5" />
                    ) : image ? (
                      <FileImage className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      onClick={() => (video || image ? handleOpenPreview(file) : handleDownload(file))}
                      className="text-xs font-medium text-white truncate hover:text-sky-400 cursor-pointer transition"
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {formatSize(file.size)}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-slate-400">
                  <span className="text-[10px] text-slate-500">
                    {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : ""}
                  </span>

                  <div className="flex items-center gap-1">
                    {(video || image) && (
                      <button
                        onClick={() => handleOpenPreview(file)}
                        className="p-1 rounded hover:text-sky-400 hover:bg-slate-800 transition"
                        title="Preview media"
                      >
                        {video ? <Play className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 rounded hover:text-white hover:bg-slate-800 transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1 rounded hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog (Lightbox / Video Player) */}
      {previewFile && (
        <Dialog
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          title={previewFile.file.name}
          description={`Size: ${formatSize(previewFile.file.size)} | Path: ${previewFile.file.key}`}
          className="max-w-4xl"
        >
          <div className="flex items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden min-h-[300px]">
            {isVideo(previewFile.file.name) ? (
              <video
                src={previewFile.url}
                controls
                autoPlay
                className="max-h-[70vh] w-full rounded-lg outline-none"
              >
                Your browser does not support HTML5 video playback.
              </video>
            ) : isImage(previewFile.file.name) ? (
              <img
                src={previewFile.url}
                alt={previewFile.file.name}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => handleDownload(previewFile.file)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Original
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
