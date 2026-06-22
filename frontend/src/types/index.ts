export type LeagueFormat = "SINGLE_ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN";
export type LeagueStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export type PlayerPosition =
  | "GOALKEEPER"
  | "DEFENDER"
  | "MIDFIELDER"
  | "FORWARD";

export type MatchStatus = "PENDING" | "LIVE" | "FINISHED";

export type MatchEventType = "GOAL" | "YELLOW_CARD" | "RED_CARD";

export interface League {
  id: number;
  name: string;
  venue: string;
  format: LeagueFormat;
  status: LeagueStatus;
  points_win: number;
  points_draw: number;
  created_at: string;
  team_count: number;
  player_count: number;
  matches_played: number;
  matches_remaining: number;
}

export interface Team {
  id: number;
  league: number;
  name: string;
  logo: string | null;
  jersey_color: string;
  created_at: string;
  player_count: number;
  captain_name: string | null;
}

export interface Player {
  id: number;
  team: number;
  team_name: string;
  name: string;
  position: PlayerPosition;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_inactive: boolean;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  has_match_history: boolean;
  created_at: string;
}

export interface MatchEvent {
  id: number;
  event_type: MatchEventType;
  player: number;
  player_name: string;
  assist_player: number | null;
  assist_player_name: string | null;
  team: number;
  team_name: string;
  created_at: string;
}

export interface Match {
  id: number;
  league: number;
  home_team: number;
  away_team: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  scheduled_date: string | null;
  started_at: string | null;
  ended_at: string | null;
  home_jersey_color: string;
  away_jersey_color: string;
  events: MatchEvent[];
}

export interface StandingRow {
  position: number;
  team_id: number;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface AwardLeader {
  player_id: number;
  player_name: string;
  team_name: string;
  value: number;
}

export interface Awards {
  top_scorer: AwardLeader[];
  top_assister: AwardLeader[];
  most_clean_sheets: AwardLeader[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FixturePreview {
  fixture_count: number;
}

export interface GenerateFixturesResponse {
  fixture_count: number;
  matches: Match[];
}
