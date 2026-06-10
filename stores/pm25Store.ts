import { create } from "zustand";
import type { PM25Data } from "@/app/types";

interface PM25State {
  actualData: PM25Data[];
  predictionData: PM25Data[];
  selectedStation: string;
  isLoading: boolean;
  error: string | null;

  setActualData: (d: PM25Data[]) => void;
  setPredictionData: (d: PM25Data[]) => void;
  setSelectedStation: (s: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const usePM25Store = create<PM25State>((set) => ({
  actualData: [],
  predictionData: [],
  selectedStation: "bundaran_hi",
  isLoading: false,
  error: null,

  setActualData: (actualData) => set({ actualData }),
  setPredictionData: (predictionData) => set({ predictionData }),
  setSelectedStation: (selectedStation) => set({ selectedStation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
