import { Trash2 } from "lucide-react";
import type { Player, PlayerPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: "GOALKEEPER", label: "Goalkeeper" },
  { value: "DEFENDER", label: "Defender" },
  { value: "MIDFIELDER", label: "Midfielder" },
  { value: "FORWARD", label: "Forward" },
];

export type SquadPlayerDraft = {
  name: string;
  position: PlayerPosition;
};

interface SquadPanelProps {
  players: Player[];
  drafts?: Record<number, SquadPlayerDraft>;
  captainId: string;
  viceCaptainId: string;
  onCaptainChange: (playerId: string) => void;
  onViceCaptainChange: (playerId: string) => void;
  readOnly?: boolean;
  editableFields?: boolean;
  onDraftChange?: (playerId: number, patch: Partial<SquadPlayerDraft>) => void;
  onDeletePlayer?: (playerId: number) => void;
  changedPlayerIds?: number[];
}

export function SquadPanel({
  players,
  drafts,
  captainId,
  viceCaptainId,
  onCaptainChange,
  onViceCaptainChange,
  readOnly = false,
  editableFields = true,
  onDraftChange,
  onDeletePlayer,
  changedPlayerIds = [],
}: SquadPanelProps) {
  const handleCaptainClick = (playerId: number) => {
    if (readOnly) return;
    const id = String(playerId);
    if (captainId === id) {
      onCaptainChange("");
    } else {
      onCaptainChange(id);
      if (viceCaptainId === id) onViceCaptainChange("");
    }
  };

  const handleViceClick = (playerId: number) => {
    if (readOnly) return;
    const id = String(playerId);
    if (viceCaptainId === id) {
      onViceCaptainChange("");
    } else {
      onViceCaptainChange(id);
      if (captainId === id) onCaptainChange("");
    }
  };

  if (players.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No players on this team.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {players.map((player) => {
        const draft = drafts?.[player.id] ?? {
          name: player.name,
          position: player.position,
        };
        const goalkeeperPlayerId = players.find(
          (p) =>
            (drafts?.[p.id] ?? { position: p.position }).position === "GOALKEEPER"
        )?.id;
        const isCaptain = captainId === String(player.id);
        const isVice = viceCaptainId === String(player.id);
        const changed = changedPlayerIds.includes(player.id);

        return (
          <li
            key={player.id}
            className={cn(
              "rounded-lg border p-3 transition-colors md:p-3",
              isCaptain && "border-primary ring-2 ring-primary/40",
              isVice && !isCaptain && "border-amber-500 ring-2 ring-amber-500/40",
              !isCaptain && !isVice && "border-border",
              changed && !readOnly && "border-primary/40"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {readOnly || !editableFields ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 truncate font-medium">{draft.name}</span>
                  <span className="shrink-0 text-xs uppercase text-muted-foreground">
                    {draft.position.replace("_", " ")}
                  </span>
                </div>
              ) : (
                <div className="flex w-full min-w-0 items-stretch gap-2 sm:flex-1">
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      onDraftChange?.(player.id, { name: e.target.value })
                    }
                    className="h-10 min-w-0 flex-[2]"
                  />
                  <Select
                    value={draft.position}
                    onValueChange={(v) =>
                      onDraftChange?.(player.id, {
                        position: v as PlayerPosition,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 min-w-[7.5rem] flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem
                          key={p.value}
                          value={p.value}
                          disabled={
                            p.value === "GOALKEEPER" &&
                            goalkeeperPlayerId !== undefined &&
                            goalkeeperPlayerId !== player.id
                          }
                        >
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex w-full items-center gap-1 sm:w-auto">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleCaptainClick(player.id)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors",
                    isCaptain
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                    readOnly && !isCaptain && "opacity-50"
                  )}
                  title="Captain"
                >
                  C
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleViceClick(player.id)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors",
                    isVice
                      ? "border-amber-500 bg-amber-500 text-black"
                      : "border-border text-muted-foreground hover:border-amber-500 hover:text-amber-500",
                    readOnly && !isVice && "opacity-50"
                  )}
                  title="Vice Captain"
                >
                  V
                </button>
                {!readOnly && onDeletePlayer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDeletePlayer(player.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
