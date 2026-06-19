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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Points Table</CardTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">GF</TableHead>
                <TableHead className="text-center">GA</TableHead>
                <TableHead className="text-center">GD</TableHead>
                <TableHead className="text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row) => (
                <TableRow key={row.team_id}>
                  <TableCell>{row.position}</TableCell>
                  <TableCell className="font-medium">{row.team_name}</TableCell>
                  <TableCell className="text-center">{row.played}</TableCell>
                  <TableCell className="text-center">{row.wins}</TableCell>
                  <TableCell className="text-center">{row.draws}</TableCell>
                  <TableCell className="text-center">{row.losses}</TableCell>
                  <TableCell className="text-center">{row.goals_for}</TableCell>
                  <TableCell className="text-center">{row.goals_against}</TableCell>
                  <TableCell className="text-center">{row.goal_difference}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">
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
