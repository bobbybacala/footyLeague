import { Circle, Goal, Square, Trash2 } from "lucide-react";
import type { MatchEvent } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EventTimelineProps {
  events: MatchEvent[];
  newestFirst?: boolean;
  onRemoveEvent?: (eventId: number) => void;
  editable?: boolean;
}

function EventIcon({ type }: { type: MatchEvent["event_type"] }) {
  switch (type) {
    case "GOAL":
      return <Goal className="h-4 w-4 text-primary" />;
    case "YELLOW_CARD":
      return <Square className="h-3 w-3 fill-yellow-400 text-yellow-400" />;
    case "RED_CARD":
      return <Square className="h-3 w-3 fill-red-500 text-red-500" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
}

function eventText(event: MatchEvent): string {
  switch (event.event_type) {
    case "GOAL":
      return event.assist_player_name
        ? `${event.player_name} (Assist: ${event.assist_player_name})`
        : event.player_name;
    case "YELLOW_CARD":
    case "RED_CARD":
      return event.player_name;
    default:
      return event.player_name;
  }
}

export function EventTimeline({
  events,
  newestFirst = false,
  onRemoveEvent,
  editable = false,
}: EventTimelineProps) {
  const sorted = newestFirst ? [...events].reverse() : events;

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No events recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sorted.map((event) => (
        <li
          key={event.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <EventIcon type={event.event_type} />
            <div>
              <p className="font-medium">{eventText(event)}</p>
              <p className="text-xs text-muted-foreground">{event.team_name}</p>
            </div>
          </div>
          {editable && onRemoveEvent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onRemoveEvent(event.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
