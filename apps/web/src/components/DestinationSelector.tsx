import { useState } from "react";
import { type Destination, api } from "../lib/api";
import { Plus, CheckCircle2, XCircle, RefreshCw, Star, HardDrive } from "lucide-react";

interface DestinationSelectorProps {
  destinations: Destination[];
  activeDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onOpenAddModal: () => void;
  onRefreshList: () => void;
}

export function DestinationSelector({
  destinations,
  activeDestination,
  onSelectDestination,
  onOpenAddModal,
  onRefreshList,
}: DestinationSelectorProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    status: "idle" | "verified" | "failed";
    latency?: number;
    error?: string;
  }>({ status: "idle" });

  const handleVerify = async () => {
    if (!activeDestination) return;
    setVerifying(true);
    setVerifyStatus({ status: "idle" });

    try {
      const result = await api.verifyDestination(activeDestination.id);
      if (result.success) {
        setVerifyStatus({ status: "verified", latency: result.latencyMs });
      } else {
        setVerifyStatus({ status: "failed", error: result.error });
      }
    } catch (err: any) {
      setVerifyStatus({ status: "failed", error: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleSetDefault = async () => {
    if (!activeDestination) return;
    try {
      await api.setDefaultDestination(activeDestination.id);
      onRefreshList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!activeDestination) return;
    if (!confirm(`Are you sure you want to remove destination "${activeDestination.name}"?`)) return;
    try {
      await api.deleteDestination(activeDestination.id);
      onRefreshList();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <HardDrive className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Target Destination
            </span>
            {activeDestination?.isDefault && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400" /> Default
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <select
              value={activeDestination?.id || ""}
              onChange={(e) => {
                const found = destinations.find((d) => d.id === e.target.value);
                if (found) {
                  onSelectDestination(found);
                  setVerifyStatus({ status: "idle" });
                }
              }}
              className="bg-slate-950 border border-slate-800 text-white font-medium text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer min-w-[200px]"
            >
              {destinations.length === 0 && <option value="">No destinations registered</option>}
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.bucket})
                </option>
              ))}
            </select>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Add a new storage destination"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      {activeDestination && (
        <div className="flex items-center gap-2">
          {/* Verification indicator */}
          {verifyStatus.status === "verified" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified ({verifyStatus.latency}ms)</span>
            </div>
          ) : verifyStatus.status === "failed" ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium cursor-help"
              title={verifyStatus.error}
            >
              <XCircle className="w-4 h-4" />
              <span>Connection Failed</span>
            </div>
          ) : null}

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition disabled:opacity-50"
            title="Test S3 read/write connectivity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin text-sky-400" : ""}`} />
            {verifying ? "Testing..." : "Verify Connection"}
          </button>

          {!activeDestination.isDefault && (
            <button
              onClick={handleSetDefault}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Set as Default
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
