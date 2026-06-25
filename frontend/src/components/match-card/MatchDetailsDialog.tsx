import type { Match } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MatchCard } from "@/components/match-card/MatchCard";
import { EventTimeline } from "@/components/match-card/EventTimeline";

interface MatchDetailsDialogProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchDetailsDialog({
  match,
  open,
  onOpenChange,
}: MatchDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Match Details</DialogTitle>
        </DialogHeader>
        {match && (
          <>
            <MatchCard match={match} />
            <EventTimeline
              events={match.events}
              isFinished={match.status === "FINISHED"}
              homeScore={match.home_score}
              awayScore={match.away_score}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
