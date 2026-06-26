import type { Match } from "@/types";

export function matchSearchHaystack(match: Match): string {
  return `${match.home_team_name} ${match.away_team_name}`.toLowerCase();
}

export function matchOptionLabel(match: Match): string {
  return `${match.home_team_name} vs ${match.away_team_name}`;
}

/** Match if every whitespace-separated token appears somewhere across both team names. */
export function filterMatchesBySearch(matches: Match[], search: string): Match[] {
  const q = search.trim().toLowerCase();
  if (!q) return matches;
  const tokens = q.split(/\s+/).filter(Boolean);
  return matches.filter((match) => {
    const haystack = matchSearchHaystack(match);
    return tokens.every((token) => haystack.includes(token));
  });
}

export function getAssignedMatchIds(matchdays: { matches: Match[] }[]): Set<number> {
  const ids = new Set<number>();
  for (const day of matchdays) {
    for (const match of day.matches) {
      ids.add(match.id);
    }
  }
  return ids;
}
