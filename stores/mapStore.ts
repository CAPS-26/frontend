import { create } from "zustand";
import type { GeoJSONData, BoundaryGeoJSONData } from "@/app/types";

export type MapDataType = "aod" | "pm25-est" | "pm25-pred";

interface MapState {
  dataType: MapDataType;
  geoData: GeoJSONData | null;
  boundaryData: BoundaryGeoJSONData | null;
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  markerPosition: [number, number] | null;

  setDataType: (t: MapDataType) => void;
  setGeoData: (d: GeoJSONData | null) => void;
  setBoundaryData: (d: BoundaryGeoJSONData | null) => void;
  setSelectedDate: (d: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setMarkerPosition: (p: [number, number] | null) => void;
  clearMarker: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  dataType: "aod",
  geoData: null,
  boundaryData: null,
  selectedDate: new Date().toISOString().split("T")[0],
  isLoading: true,
  error: null,
  markerPosition: null,

  setDataType: (dataType) => set({ dataType }),
  setGeoData: (geoData) => set({ geoData }),
  setBoundaryData: (boundaryData) => set({ boundaryData }),
  setSelectedDate: (selectedDate) => set({ selectedDate, markerPosition: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setMarkerPosition: (markerPosition) => set({ markerPosition }),
  clearMarker: () => set({ markerPosition: null }),
}));
