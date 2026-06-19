import { create } from "zustand";

interface LeagueStore {
  currentLeagueId: number | null;
  setCurrentLeagueId: (id: number | null) => void;
}

export const useLeagueStore = create<LeagueStore>((set) => ({
  currentLeagueId: null,
  setCurrentLeagueId: (id) => set({ currentLeagueId: id }),
}));
