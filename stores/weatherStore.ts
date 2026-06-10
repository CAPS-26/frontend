import { create } from "zustand";
import type { WeatherData } from "@/app/types";

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;

  setData: (d: WeatherData | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  setData: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
