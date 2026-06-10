import { create } from "zustand";
import type { PM25Data } from "@/app/types";

interface PredictionState {
  data: PM25Data[];
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
  jobStatus: string | null;

  setData: (d: PM25Data[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setJobId: (id: string | null) => void;
  setJobStatus: (s: string | null) => void;
}

export const usePredictionStore = create<PredictionState>((set) => ({
  data: [],
  isLoading: false,
  error: null,
  jobId: null,
  jobStatus: null,

  setData: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
}));
