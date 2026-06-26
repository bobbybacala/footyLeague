import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeApiLoading } from "@/lib/apiLoading";

export function ApiLoadingOverlay() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeApiLoading((count) => setLoading(count > 0)), []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card px-8 py-6 shadow-lg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
