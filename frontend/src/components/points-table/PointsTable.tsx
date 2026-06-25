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
    <Card className="h-full border-border/60">
      <CardHeader>
        <CardTitle>League Table</CardTitle>
      </CardHeader>
      <CardContent>
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
          <div className="overflow-x-auto md:overflow-visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="hidden text-center sm:table-cell">P</TableHead>
                <TableHead className="hidden text-center md:table-cell">W</TableHead>
                <TableHead className="hidden text-center md:table-cell">D</TableHead>
                <TableHead className="hidden text-center md:table-cell">L</TableHead>
                <TableHead className="hidden text-center lg:table-cell">GF</TableHead>
                <TableHead className="hidden text-center lg:table-cell">GA</TableHead>
                <TableHead className="hidden text-center lg:table-cell">GD</TableHead>
                <TableHead className="text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row) => (
                <TableRow key={row.team_id}>
                  <TableCell>{row.position}</TableCell>
                  <TableCell className="max-w-[8rem] truncate font-medium sm:max-w-none">
                    {row.team_name}
                  </TableCell>
                  <TableCell className="hidden text-center sm:table-cell">{row.played}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{row.wins}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{row.draws}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{row.losses}</TableCell>
                  <TableCell className="hidden text-center lg:table-cell">{row.goals_for}</TableCell>
                  <TableCell className="hidden text-center lg:table-cell">{row.goals_against}</TableCell>
                  <TableCell className="hidden text-center lg:table-cell">{row.goal_difference}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">
                    {row.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
