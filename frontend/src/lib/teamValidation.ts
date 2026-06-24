import type { Player, PlayerPosition } from "@/types";

export type PlayerDraft = {
  name: string;
  position: PlayerPosition;
};

type SquadPlayer = Pick<Player, "id" | "name" | "position" | "is_captain">;

export function validateTeamPlayers(players: SquadPlayer[]): string | null {
  const drafts = Object.fromEntries(
    players.map((p) => [p.id, { name: p.name, position: p.position }])
  );
  const error = validateTeamSquad(
    players.map((p) => p.id),
    drafts
  );
  if (error) return error;
  if (!players.some((p) => p.is_captain)) {
    return "Please select a captain.";
  }
  return null;
}

export function validateTeamSquad(
  playerIds: number[],
  drafts: Record<number, PlayerDraft>
): string | null {
  if (playerIds.length < 2) {
    return "Each team must have at least 2 players.";
  }
  const goalkeeperCount = playerIds.filter(
    (id) => drafts[id]?.position === "GOALKEEPER"
  ).length;
  if (goalkeeperCount > 1) {
    return "Each team can have only one goalkeeper.";
  }
  if (goalkeeperCount === 0) {
    return "Each team must have at least one goalkeeper.";
  }
  return null;
}
