import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { subscribeApiLoading } from "@/lib/apiLoading";

export function ApiLoadingOverlay() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeApiLoading((count) => setLoading(count > 0)), []);

  useEffect(() => {
    if (!loading) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [loading]);

  if (!loading) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex cursor-wait items-center justify-center bg-background/70 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
      role="presentation"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="pointer-events-none flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card px-8 py-6 shadow-lg"
        role="status"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>,
    document.body
  );
}

export function useApiLoading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeApiLoading((count) => setLoading(count > 0)), []);

  return loading;
}
