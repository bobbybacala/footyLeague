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

export function MatchCard({ match, onClick, className }: MatchCardProps) {
  const Component = onClick ? "button" : "div";
  const showStatusBadge = match.status !== "PENDING";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "grid w-full grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-3.5 text-left transition-colors md:grid-cols-[2.5rem_1fr_2.5rem] md:gap-3 md:px-4 md:py-4",
        onClick && "cursor-pointer hover:border-border/80 hover:bg-secondary/30",
        className
      )}
    >
      {showStatusBadge ? (
        <span className="w-fit rounded-sm bg-muted/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-muted-foreground">
          {statusLabel(match.status)}
        </span>
      ) : (
        <span aria-hidden className="w-full" />
      )}

      <div className="flex min-w-0 items-center justify-center gap-3 md:gap-4">
        <span className="max-w-[5rem] truncate text-right text-xs font-medium md:max-w-[7rem] md:text-sm">
          {match.home_team_name}
        </span>
        <JerseyDot color={match.home_jersey_color} />
        <span className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-muted-foreground md:text-base">
          {centerLabel(match)}
        </span>
        <JerseyDot color={match.away_jersey_color} />
        <span className="max-w-[5rem] truncate text-left text-xs font-medium md:max-w-[7rem] md:text-sm">
          {match.away_team_name}
        </span>
      </div>

      <div aria-hidden className="w-full" />
    </Component>
  );
}
