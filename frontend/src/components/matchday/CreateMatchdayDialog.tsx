import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableMatchMultiSelect } from "@/components/matchday/SearchableMatchMultiSelect";
import {
  getAssignedMatchIds,
  matchOptionLabel,
} from "@/lib/matchSearch";
import { cn } from "@/lib/utils";
import type { Match, Matchday } from "@/types";

const inputPlaceholderClass = "placeholder:text-muted-foreground/45";

interface CreateMatchdayDialogProps {
  leagueId: number;
  pendingMatches: Match[];
  matchdays: Matchday[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (matchday: Matchday) => void;
}

export function CreateMatchdayDialog({
  leagueId,
  pendingMatches,
  matchdays,
  open,
  onOpenChange,
  onCreated,
}: CreateMatchdayDialogProps) {
  const { toast } = useToast();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [selectedMatchIds, setSelectedMatchIds] = useState<number[]>([]);

  const assignedIds = useMemo(
    () => getAssignedMatchIds(matchdays),
    [matchdays]
  );

  const availableOptions = useMemo(
    () =>
      pendingMatches
        .filter((m) => !assignedIds.has(m.id))
        .map((m) => ({ id: m.id, label: matchOptionLabel(m) })),
    [pendingMatches, assignedIds]
  );

  const reset = () => {
    setTitle("");
    setDate("");
    setSelectedMatchIds([]);
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    } else {
      input.focus();
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      leaguesApi.createMatchday(leagueId, {
        title: title.trim(),
        date,
        match_ids: selectedMatchIds,
      }),
    onSuccess: (matchday) => {
      toast("Matchday created!", "success");
      onCreated(matchday);
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("Enter a matchday title.", "error");
      return;
    }
    if (!date) {
      toast("Select a matchday date.", "error");
      return;
    }
    if (selectedMatchIds.length === 0) {
      toast("Select at least one fixture.", "error");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        overlayClassName="z-[10000]"
        className="z-[10001] max-w-md"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest("input[type='date']") ||
            target.closest("[data-matchday-fixtures]")
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest("input[type='date']") ||
            target.closest("[data-matchday-fixtures]")
          ) {
            e.preventDefault();
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Matchday</DialogTitle>
            <DialogDescription>
              Group upcoming fixtures into a matchday with a title and date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="matchday-title">Matchday Title</Label>
              <Input
                id="matchday-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Matchday 1"
                className={inputPlaceholderClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchday-date">Matchday Date</Label>
              <div
                className="relative cursor-pointer"
                onClick={openDatePicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDatePicker();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Open date picker"
              >
                <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  ref={dateInputRef}
                  id="matchday-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={cn(
                    "cursor-pointer pl-10 [color-scheme:dark]",
                    "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                    !date && "text-muted-foreground/45"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDatePicker();
                  }}
                />
              </div>
            </div>

            <div className="space-y-2" data-matchday-fixtures>
              <Label>Matchday Fixtures</Label>
              <SearchableMatchMultiSelect
                options={availableOptions}
                selectedIds={selectedMatchIds}
                onChange={setSelectedMatchIds}
                placeholder="Select pending matches..."
                emptyMessage={
                  availableOptions.length === 0
                    ? "No pending matches available."
                    : "No matches match your search."
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Create Matchday
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
