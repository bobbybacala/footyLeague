import type { Awards } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AwardsPanelProps {
  awards?: Awards;
  isLoading?: boolean;
}

function AwardSection({
  title,
  leaders,
  suffix,
}: {
  title: string;
  leaders: { player_name: string; team_name: string; value: number }[];
  suffix: string;
}) {
  return (
    <div className="space-y-1 border-b border-border pb-4 last:border-0 last:pb-0">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      {leaders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet</p>
      ) : (
        leaders.map((leader) => (
          <p key={`${title}-${leader.player_name}`} className="text-sm">
            <span className="font-semibold text-primary">
              {leader.player_name}
            </span>{" "}
            ({leader.value} {suffix})
            <span className="block text-xs text-muted-foreground">
              {leader.team_name}
            </span>
          </p>
        ))
      )}
    </div>
  );
}

export function AwardsPanel({ awards, isLoading }: AwardsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Individual Awards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <AwardSection
              title="Top Scorer"
              leaders={awards?.top_scorer ?? []}
              suffix="Goals"
            />
            <AwardSection
              title="Top Assister"
              leaders={awards?.top_assister ?? []}
              suffix="Assists"
            />
            <AwardSection
              title="Most Clean Sheets"
              leaders={awards?.most_clean_sheets ?? []}
              suffix="Clean Sheets"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
