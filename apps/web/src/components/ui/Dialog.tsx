import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "max-w-xl",
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            className={`relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition-all duration-200 ${className}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                {title && (
                  <BaseDialog.Title className="text-lg font-semibold text-white tracking-tight">
                    {title}
                  </BaseDialog.Title>
                )}
                {description && (
                  <BaseDialog.Description className="text-sm text-slate-400 mt-0.5">
                    {description}
                  </BaseDialog.Description>
                )}
              </div>
              <BaseDialog.Close className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <X className="h-5 w-5" />
              </BaseDialog.Close>
            </div>
            {children}
          </BaseDialog.Popup>
        </div>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
