import type { PlayerPosition } from "@/types";

export type PlayerDraft = {
  name: string;
  position: PlayerPosition;
};

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
