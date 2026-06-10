"use client";

import { useCallback } from "react";
import { useWeatherStore } from "@/stores";
import weatherApi from "@/services/weatherApi";

export function useWeather() {
  const store = useWeatherStore();

  const fetchLatest = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await weatherApi.getLatest();
      store.setData(data.length > 0 ? data[0] : null);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Gagal memuat cuaca");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchByDate = useCallback(
    async (date: string) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const data = await weatherApi.getByDate(date);
        store.setData(data.length > 0 ? data[0] : null);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : "Gagal memuat cuaca");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
    fetchLatest,
    fetchByDate,
  };
}
