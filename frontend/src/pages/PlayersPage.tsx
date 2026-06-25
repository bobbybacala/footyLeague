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
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">Players</h1>
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
        <div className="overflow-x-auto rounded-xl border border-border md:overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="hidden text-right md:table-cell">Goals</TableHead>
                <TableHead className="hidden text-right md:table-cell">Assists</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Yellow</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Red</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <span className="block truncate">{player.name}</span>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {player.team_name}
                      </span>
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
                    <TableCell className="hidden sm:table-cell">{player.team_name}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {player.position.replace("_", " ")}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">{player.goals}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">{player.assists}</TableCell>
                    <TableCell className="hidden text-right lg:table-cell">{player.yellow_cards}</TableCell>
                    <TableCell className="hidden text-right lg:table-cell">{player.red_cards}</TableCell>
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
