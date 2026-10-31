import { useState, useEffect } from "react";
import { api, type Destination } from "./lib/api";
import { DestinationSelector } from "./components/DestinationSelector";
import { DestinationModal } from "./components/DestinationModal";
import { FileUploader } from "./components/FileUploader";
import { MediaBrowser } from "./components/MediaBrowser";
import { CloudUpload, Layers } from "lucide-react";

export function App() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadDestinations = async () => {
    try {
      const list = await api.getDestinations();
      setDestinations(list);
      if (list.length > 0) {
        // Find default or pick first
        const defaultDest = list.find((d) => d.isDefault) || list[0];
        setActiveDestination((prev) => {
          if (!prev) return defaultDest;
          const stillExists = list.find((d) => d.id === prev.id);
          return stillExists || defaultDest;
        });
        if (!currentPath && defaultDest.pathPrefix) {
          setCurrentPath(defaultDest.pathPrefix);
        }
      } else {
        setActiveDestination(null);
      }
    } catch (err) {
      console.error("Failed to load destinations", err);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const handleSelectDestination = (dest: Destination) => {
    setActiveDestination(dest);
    setCurrentPath(dest.pathPrefix || "");
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* App Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              DropDock
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Multi-Destination
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct-to-storage S3 & multi-cloud file upload and media browser
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Bun + Hono + Base UI + Tailwind CSS</span>
        </div>
      </header>

      {/* Destination Switcher & Status */}
      <DestinationSelector
        destinations={destinations}
        activeDestination={activeDestination}
        onSelectDestination={handleSelectDestination}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onRefreshList={loadDestinations}
      />

      {/* Main Content Area */}
      {destinations.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <CloudUpload className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-base font-semibold text-white">No Storage Destination Registered</h2>
            <p className="text-xs text-slate-400">
              Add your first AWS S3 bucket, Cloudflare R2, or MinIO instance to start uploading files
              directly with presigned URLs.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition shadow-lg shadow-sky-500/20"
          >
            Add Your First Destination
          </button>
        </div>
      ) : activeDestination ? (
        <div className="space-y-8">
          {/* Section 1: Uploader with Custom Path */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-sky-400" />
                Upload New Files
              </h2>
              <span className="text-xs text-slate-500">
                Presigned direct-to-storage PUT
              </span>
            </div>

            <FileUploader
              destination={activeDestination}
              currentPath={currentPath}
              onPathChange={setCurrentPath}
              onUploadComplete={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </section>

          {/* Section 2: Explorer and Media Browser */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Stored Files & Media
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {activeDestination.endpoint || "AWS S3"} · {activeDestination.region}
              </span>
            </div>

            <MediaBrowser
              destination={activeDestination}
              currentPath={currentPath}
              onNavigate={setCurrentPath}
              refreshTrigger={refreshTrigger}
            />
          </section>
        </div>
      ) : null}

      {/* Add Destination Modal */}
      <DestinationModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          loadDestinations();
        }}
      />
    </div>
  );
}
export default App;
