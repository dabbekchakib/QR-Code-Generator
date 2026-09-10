"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast, dismissToast } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const icons = {
  default: <Info className="size-4" aria-hidden />,
  success: <CheckCircle2 className="size-4 text-success" aria-hidden />,
  error: <AlertCircle className="size-4 text-destructive" aria-hidden />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 slide-in-from-bottom-2"
          )}
        >
          {icons[toast.variant ?? "default"]}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}