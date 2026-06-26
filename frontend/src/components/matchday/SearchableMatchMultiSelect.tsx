import * as React from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MatchOption {
  id: number;
  label: string;
}

interface SearchableMatchMultiSelectProps {
  options: MatchOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

const inputPlaceholderClass = "placeholder:text-muted-foreground/45";

export function SearchableMatchMultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Select matches...",
  emptyMessage = "No matches found.",
}: SearchableMatchMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    const tokens = q.split(/\s+/).filter(Boolean);
    return options.filter((opt) => {
      const haystack = opt.label.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [options, search]);

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id));

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const remove = (id: number) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-between px-3 text-left font-normal"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm text-muted-foreground/80">
          {selectedIds.length > 0
            ? `${selectedIds.length} fixture${selectedIds.length === 1 ? "" : "s"} selected`
            : placeholder}
        </span>
        {open ? (
          <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>

      {open && (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <div className="border-b border-border p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className={cn("h-9", inputPlaceholderClass)}
            />
          </div>
          <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground/70">
                {emptyMessage}
              </p>
            ) : (
              filtered.map((opt) => {
                const checked = selectedIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary",
                      checked && "bg-secondary/60"
                    )}
                    onClick={() => toggle(opt.id)}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border",
                        checked &&
                          "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="flex max-h-44 flex-col gap-2 overflow-y-auto">
          {selectedOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-secondary/20 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 font-medium leading-snug">
                {opt.label}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => remove(opt.id)}
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
