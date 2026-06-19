import axios from "axios";
import type {
  Awards,
  League,
  LeagueFormat,
  Match,
  PaginatedResponse,
  Player,
  PlayerPosition,
  StandingRow,
  Team,
} from "@/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results;
}

export const leaguesApi = {
  list: async (): Promise<League[]> => {
    const { data } = await api.get<League[] | PaginatedResponse<League>>(
      "/leagues/"
    );
    return unwrapList(data);
  },
  get: async (id: number): Promise<League> => {
    const { data } = await api.get<League>(`/leagues/${id}/`);
    return data;
  },
  create: async (payload: {
    name: string;
    venue: string;
    format?: LeagueFormat;
  }): Promise<League> => {
    const { data } = await api.post<League>("/leagues/", payload);
    return data;
  },
  update: async (
    id: number,
    payload: Partial<{ name: string; venue: string; format: LeagueFormat }>
  ): Promise<League> => {
    const { data } = await api.patch<League>(`/leagues/${id}/`, payload);
    return data;
  },
  standings: async (id: number): Promise<StandingRow[]> => {
    const { data } = await api.get<StandingRow[]>(`/leagues/${id}/standings/`);
    return data;
  },
  awards: async (id: number): Promise<Awards> => {
    const { data } = await api.get<Awards>(`/leagues/${id}/awards/`);
    return data;
  },
  matches: async (
    id: number,
    status?: string
  ): Promise<Match[]> => {
    const { data } = await api.get<Match[] | PaginatedResponse<Match>>(
      `/matches/leagues/${id}/matches/`,
      { params: status ? { status } : undefined }
    );
    return unwrapList(data);
  },
  generateFixtures: async (id: number): Promise<Match[]> => {
    const { data } = await api.post<Match[]>(
      `/leagues/${id}/generate-fixtures/`
    );
    return data;
  },
};

export const teamsApi = {
  list: async (leagueId: number): Promise<Team[]> => {
    const { data } = await api.get<Team[] | PaginatedResponse<Team>>(
      `/leagues/${leagueId}/teams/`
    );
    return unwrapList(data);
  },
  create: async (leagueId: number, name: string): Promise<Team> => {
    const { data } = await api.post<Team>(`/leagues/${leagueId}/teams/`, {
      name,
    });
    return data;
  },
};

export const playersApi = {
  list: async (teamId: number): Promise<Player[]> => {
    const { data } = await api.get<Player[] | PaginatedResponse<Player>>(
      `/teams/${teamId}/players/`
    );
    return unwrapList(data);
  },
  create: async (
    teamId: number,
    payload: {
      name: string;
      position: PlayerPosition;
      is_captain?: boolean;
    }
  ): Promise<Player> => {
    const { data } = await api.post<Player>(
      `/teams/${teamId}/players/`,
      payload
    );
    return data;
  },
};

export const matchesApi = {
  get: async (id: number): Promise<Match> => {
    const { data } = await api.get<Match>(`/matches/${id}/`);
    return data;
  },
  start: async (id: number): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/start/`);
    return data;
  },
  goal: async (
    id: number,
    payload: { scorer_id: number; assist_id?: number | null }
  ): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/goal/`, payload);
    return data;
  },
  yellowCard: async (id: number, playerId: number): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/yellow-card/`, {
      player_id: playerId,
    });
    return data;
  },
  redCard: async (id: number, playerId: number): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/red-card/`, {
      player_id: playerId,
    });
    return data;
  },
  end: async (id: number): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/end/`);
    return data;
  },
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.join(", ");
  }
  return "Something went wrong. Please try again.";
}
