import type { Match, MatchStatus } from "@/types";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  className?: string;
}

function statusLabel(status: MatchStatus): string {
  switch (status) {
    case "FINISHED":
      return "FT";
    case "LIVE":
      return "LIVE";
    default:
      return "";
  }
}

function JerseyDot({ color }: { color: string }) {
  const resolved = color?.startsWith("#") ? color : "#71717a";
  return (
    <span
      className="h-[18px] w-[18px] shrink-0 rounded-full border border-white/10 shadow-sm md:h-5 md:w-5"
      style={{ backgroundColor: resolved }}
      aria-hidden
    />
  );
}

function centerLabel(match: Match): string {
  if (match.status === "FINISHED" || match.status === "LIVE") {
    return `${match.home_score} - ${match.away_score}`;
  }
  return "vs";
}

function MatchupRow({ match }: { match: Match }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-3">
      <span className="min-w-0 max-md:truncate text-right text-xs font-medium sm:text-sm md:whitespace-nowrap">
        {match.home_team_name}
      </span>
      <JerseyDot color={match.home_jersey_color} />
      <span className="shrink-0 px-0.5 text-sm font-bold tabular-nums tracking-tight text-muted-foreground md:text-base">
        {centerLabel(match)}
      </span>
      <JerseyDot color={match.away_jersey_color} />
      <span className="min-w-0 max-md:truncate text-left text-xs font-medium sm:text-sm md:whitespace-nowrap">
        {match.away_team_name}
      </span>
    </div>
  );
}

export function MatchCard({ match, onClick, className }: MatchCardProps) {
  const Component = onClick ? "button" : "div";
  const showStatusBadge = match.status !== "PENDING";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border/40 bg-card/60 text-left transition-colors",
        onClick && "cursor-pointer hover:border-border/80 hover:bg-secondary/30",
        showStatusBadge
          ? "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 py-3.5 md:gap-3 md:px-4 md:py-4"
          : "px-3 py-3.5 md:px-4 md:py-4",
        className
      )}
    >
      {showStatusBadge && (
        <span className="shrink-0 rounded-sm bg-muted/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-muted-foreground">
          {statusLabel(match.status)}
        </span>
      )}
      <MatchupRow match={match} />
    </Component>
  );
}
