import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { leaguesApi } from "@/api/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const [search, setSearch] = useState("");

  const { data: players, isLoading } = useQuery({
    queryKey: ["league-players", leagueId],
    queryFn: () => leaguesApi.players(leagueId),
  });

  const filtered = useMemo(() => {
    if (!players) return [];
    const q = search.toLowerCase().trim();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team_name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
    );
  }, [players, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Players</h1>
        <p className="mt-1 text-muted-foreground">Global player directory</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead className="text-right">Assists</TableHead>
                <TableHead className="text-right">Yellow</TableHead>
                <TableHead className="text-right">Red</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {player.name}
                      {player.is_captain && (
                        <Badge variant="outline" className="ml-2">
                          C
                        </Badge>
                      )}
                      {player.is_inactive && (
                        <Badge variant="secondary" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{player.team_name}</TableCell>
                    <TableCell>{player.position.replace("_", " ")}</TableCell>
                    <TableCell className="text-right">{player.goals}</TableCell>
                    <TableCell className="text-right">{player.assists}</TableCell>
                    <TableCell className="text-right">{player.yellow_cards}</TableCell>
                    <TableCell className="text-right">{player.red_cards}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No players found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
