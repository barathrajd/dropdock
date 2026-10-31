import React, { useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Tabs } from "@base-ui/react/tabs";
import { api, type CreateDestinationPayload } from "../lib/api";
import { Server, Cloud, HardDrive, ShieldCheck, Loader2 } from "lucide-react";

interface DestinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DestinationModal({ open, onOpenChange, onSuccess }: DestinationModalProps) {
  const [providerType, setProviderType] = useState<string>("aws");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateDestinationPayload>({
    name: "",
    provider: "s3",
    endpoint: "",
    region: "us-east-1",
    bucket: "",
    pathPrefix: "",
    accessKeyId: "",
    secretAccessKey: "",
    publicBaseUrl: "",
    isDefault: false,
  });

  const handleProviderPresetChange = (val: string) => {
    setProviderType(val);
    if (val === "aws") {
      setForm((prev) => ({
        ...prev,
        endpoint: "",
        region: "us-east-1",
      }));
    } else if (val === "r2") {
      setForm((prev) => ({
        ...prev,
        endpoint: "https://<account_id>.r2.cloudflarestorage.com",
        region: "auto",
      }));
    } else if (val === "minio") {
      setForm((prev) => ({
        ...prev,
        endpoint: "http://localhost:9000",
        region: "us-east-1",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createDestination(form);
      onSuccess();
      onOpenChange(false);
      // Reset form
      setForm({
        name: "",
        provider: "s3",
        endpoint: "",
        region: "us-east-1",
        bucket: "",
        pathPrefix: "",
        accessKeyId: "",
        secretAccessKey: "",
        publicBaseUrl: "",
        isDefault: false,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create destination");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Storage Destination"
      description="Register an S3-compatible account (AWS S3, Cloudflare R2, MinIO)."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Storage Provider Type
          </label>
          <Tabs.Root value={providerType} onValueChange={(val) => handleProviderPresetChange(val as string)}>
            <Tabs.List className="grid grid-cols-4 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <Tabs.Tab
                value="aws"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition data-[selected]:bg-sky-500/20 data-[selected]:text-sky-400 data-[selected]:border data-[selected]:border-sky-500/30"
              >
                <Cloud className="w-3.5 h-3.5" /> AWS S3
              </Tabs.Tab>
              <Tabs.Tab
                value="r2"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition data-[selected]:bg-sky-500/20 data-[selected]:text-sky-400 data-[selected]:border data-[selected]:border-sky-500/30"
              >
                <Server className="w-3.5 h-3.5" /> Cloudflare R2
              </Tabs.Tab>
              <Tabs.Tab
                value="minio"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition data-[selected]:bg-sky-500/20 data-[selected]:text-sky-400 data-[selected]:border data-[selected]:border-sky-500/30"
              >
                <HardDrive className="w-3.5 h-3.5" /> MinIO
              </Tabs.Tab>
              <Tabs.Tab
                value="custom"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition data-[selected]:bg-sky-500/20 data-[selected]:text-sky-400 data-[selected]:border data-[selected]:border-sky-500/30"
              >
                Custom S3
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Destination Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Production Assets S3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bucket Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. my-media-bucket"
              value={form.bucket}
              onChange={(e) => setForm({ ...form, bucket: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Region</label>
            <input
              type="text"
              placeholder="e.g. us-east-1 or ap-south-1"
              value={form.region || ""}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Endpoint {providerType === "aws" ? "(Optional)" : "*"}
            </label>
            <input
              type="text"
              placeholder={providerType === "r2" ? "https://<acc>.r2.cloudflarestorage.com" : "http://localhost:9000"}
              value={form.endpoint || ""}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Access Key ID *</label>
            <input
              type="text"
              required
              placeholder="AKIA..."
              value={form.accessKeyId}
              onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Secret Access Key *</label>
            <input
              type="password"
              required
              placeholder="••••••••••••••••••••"
              value={form.secretAccessKey}
              onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Default Folder / Prefix</label>
            <input
              type="text"
              placeholder="e.g. uploads/2026"
              value={form.pathPrefix || ""}
              onChange={(e) => setForm({ ...form, pathPrefix: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Public CDN / Base URL (Optional)</label>
            <input
              type="text"
              placeholder="https://cdn.example.com"
              value={form.publicBaseUrl || ""}
              onChange={(e) => setForm({ ...form, publicBaseUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
          />
          <label htmlFor="isDefault" className="text-xs text-slate-300 font-medium cursor-pointer">
            Set as default storage destination
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted at rest with AES-256-GCM in local SQLite</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Destination
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
