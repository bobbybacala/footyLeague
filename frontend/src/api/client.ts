import axios from "axios";
import type {
  AppRole,
  Awards,
  FixturePreview,
  GenerateFixturesResponse,
  League,
  LeagueFormat,
  Match,
  PaginatedResponse,
  Player,
  PlayerPosition,
  StandingRow,
  Team,
} from "@/types";
import { getStoredToken } from "@/lib/authStorage";
import { startApiLoading, stopApiLoading } from "@/lib/apiLoading";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  startApiLoading();
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    stopApiLoading();
    return response;
  },
  (error) => {
    stopApiLoading();
    return Promise.reject(error);
  }
);

export const authApi = {
  session: async (): Promise<{ role: AppRole | null }> => {
    const { data } = await api.get<{ role: AppRole | null }>("/auth/session/");
    return data;
  },
  loginViewer: async (): Promise<{ role: AppRole; token: string }> => {
    const { data } = await api.post<{ role: AppRole; token: string }>(
      "/auth/viewer/"
    );
    return data;
  },
  loginEditor: async (
    secretKey: string
  ): Promise<{ role: AppRole; token: string }> => {
    const { data } = await api.post<{ role: AppRole; token: string }>(
      "/auth/editor/",
      { secret_key: secretKey }
    );
    return data;
  },
};

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
    payload: Partial<{
      name: string;
      venue: string;
      format: LeagueFormat;
      points_win: number;
      points_draw: number;
    }>
  ): Promise<League> => {
    const { data } = await api.patch<League>(`/leagues/${id}/`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/leagues/${id}/`);
  },
  conclude: async (id: number): Promise<League> => {
    const { data } = await api.post<League>(`/leagues/${id}/conclude/`);
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
  players: async (id: number): Promise<Player[]> => {
    const { data } = await api.get<Player[] | PaginatedResponse<Player>>(
      `/leagues/${id}/players/`
    );
    return unwrapList(data);
  },
  matches: async (id: number, status?: string): Promise<Match[]> => {
    const { data } = await api.get<Match[] | PaginatedResponse<Match>>(
      `/matches/leagues/${id}/matches/`,
      { params: status ? { status } : undefined }
    );
    return unwrapList(data);
  },
  fixturePreview: async (id: number): Promise<FixturePreview> => {
    const { data } = await api.get<FixturePreview>(
      `/leagues/${id}/fixture-preview/`
    );
    return data;
  },
  generateFixtures: async (id: number): Promise<GenerateFixturesResponse> => {
    const { data } = await api.post<GenerateFixturesResponse>(
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
  get: async (id: number): Promise<Team> => {
    const { data } = await api.get<Team>(`/leagues/teams/${id}/`);
    return data;
  },
  create: async (
    leagueId: number,
    name: string,
    jersey_color = "#22c55e"
  ): Promise<Team> => {
    const { data } = await api.post<Team>(`/leagues/${leagueId}/teams/`, {
      name,
      jersey_color,
    });
    return data;
  },
  update: async (id: number, payload: { name: string }): Promise<Team> => {
    const { data } = await api.patch<Team>(`/leagues/teams/${id}/`, payload);
    return data;
  },
  updateJerseyColor: async (id: number, jersey_color: string): Promise<Team> => {
    const { data } = await api.patch<Team>(`/leagues/teams/${id}/`, {
      jersey_color,
    });
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/leagues/teams/${id}/`);
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
  update: async (
    id: number,
    payload: Partial<{
      name: string;
      position: PlayerPosition;
      is_captain: boolean;
      is_vice_captain?: boolean;
    }>
  ): Promise<Player> => {
    const { data } = await api.patch<Player>(`/teams/players/${id}/`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/teams/players/${id}/`);
  },
};

export const matchesApi = {
  get: async (id: number): Promise<Match> => {
    const { data } = await api.get<Match>(`/matches/${id}/`);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/matches/${id}/`);
  },
  update: async (
    id: number,
    payload: Partial<{ home_jersey_color: string; away_jersey_color: string }>
  ): Promise<Match> => {
    const { data } = await api.patch<Match>(`/matches/${id}/`, payload);
    return data;
  },
  start: async (
    id: number,
    payload?: { home_jersey_color: string; away_jersey_color: string }
  ): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/start/`, payload ?? {});
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
  undo: async (id: number): Promise<Match> => {
    const { data } = await api.post<Match>(`/matches/${id}/undo/`);
    return data;
  },
  removeEvent: async (matchId: number, eventId: number): Promise<Match> => {
    const { data } = await api.post<Match>(
      `/matches/${matchId}/events/${eventId}/remove/`
    );
    return data;
  },
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.join(", ");
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const messages = Object.values(data).flat();
      if (messages.length) return messages.join(", ");
    }
  }
  return "Something went wrong. Please try again.";
}
