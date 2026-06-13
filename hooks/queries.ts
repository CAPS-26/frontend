"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { pm25Api, weatherApi, aodApi } from "@/services";
import type { PM25Data, WeatherData, GeoJSONData } from "@/app/types";

export function usePM25Actual() {
  return useQuery({
    queryKey: ["pm25", "actual"],
    queryFn: () => pm25Api.getActualLatest(),
    staleTime: 5 * 60_000,
  });
}

export function usePM25ActualByDate(date: string | null) {
  return useQuery({
    queryKey: ["pm25", "actual", date],
    queryFn: () => pm25Api.getActualByDate(date!),
    enabled: !!date,
    staleTime: 10 * 60_000,
  });
}

export function usePM25PredictionByDate(date: string | null) {
  return useQuery({
    queryKey: ["pm25", "prediction", date],
    queryFn: () => pm25Api.getPredictionByDate(date!),
    enabled: !!date,
    staleTime: 10 * 60_000,
  });
}

export function useWeatherByDate(date: string | null) {
  return useQuery({
    queryKey: ["weather", date],
    queryFn: async () => {
      const data = await weatherApi.getByDate(date!);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!date,
    staleTime: 15 * 60_000,
  });
}

export function useAODLatest() {
  return useQuery({
    queryKey: ["aod", "latest"],
    queryFn: () => aodApi.getLatestPolygon(),
    staleTime: 10 * 60_000,
  });
}

export function useAODByDate(date: string | null) {
  return useQuery({
    queryKey: ["aod", date],
    queryFn: () => aodApi.getPolygonByDate(date!),
    enabled: !!date,
    staleTime: 30 * 60_000,
  });
}

export function usePM25Batch(dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: ["pm25", "actual", date],
      queryFn: () => pm25Api.getActualByDate(date),
      staleTime: 10 * 60_000,
      retry: 1,
    })),
  });
}

export function usePredictionBatch(dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: ["pm25", "prediction", date],
      queryFn: () => pm25Api.getPredictionByDate(date),
      staleTime: 10 * 60_000,
      retry: 1,
    })),
  });
}
