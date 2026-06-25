import type { StandingRow } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface PointsTableProps {
  standings: StandingRow[];
  isLoading?: boolean;
}

export function PointsTable({ standings, isLoading }: PointsTableProps) {
  return (
    <Card className="h-full min-w-0 overflow-hidden border-border/60">
      <CardHeader>
        <CardTitle>League Table</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : standings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No standings yet. Complete a match to see results.
          </p>
        ) : (
          <Table className="w-max min-w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Pos</TableHead>
                <TableHead className="whitespace-nowrap">Team</TableHead>
                <TableHead className="whitespace-nowrap text-center">P</TableHead>
                <TableHead className="whitespace-nowrap text-center">W</TableHead>
                <TableHead className="whitespace-nowrap text-center">D</TableHead>
                <TableHead className="whitespace-nowrap text-center">L</TableHead>
                <TableHead className="whitespace-nowrap text-center">GF</TableHead>
                <TableHead className="whitespace-nowrap text-center">GA</TableHead>
                <TableHead className="whitespace-nowrap text-center">GD</TableHead>
                <TableHead className="whitespace-nowrap text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row) => (
                <TableRow key={row.team_id}>
                  <TableCell className="whitespace-nowrap">{row.position}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {row.team_name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.played}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.wins}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.draws}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.losses}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.goals_for}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.goals_against}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">{row.goal_difference}</TableCell>
                  <TableCell className="whitespace-nowrap text-center font-semibold text-primary">
                    {row.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
