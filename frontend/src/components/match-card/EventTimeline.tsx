import type { MatchEvent } from "@/types";

interface EventTimelineProps {
  events: MatchEvent[];
}

function eventLabel(event: MatchEvent): string {
  switch (event.event_type) {
    case "GOAL":
      return event.assist_player_name
        ? `⚽ ${event.player_name} (Assist: ${event.assist_player_name})`
        : `⚽ ${event.player_name}`;
    case "YELLOW_CARD":
      return `🟨 ${event.player_name}`;
    case "RED_CARD":
      return `🟥 ${event.player_name}`;
    default:
      return event.player_name;
  }
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No events recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {eventLabel(event)}
          <span className="ml-2 text-xs text-muted-foreground">
            {event.team_name}
          </span>
        </li>
      ))}
    </ul>
  );
}
