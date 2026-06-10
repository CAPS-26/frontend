"use client";

import { useCallback } from "react";
import { usePM25Store } from "@/stores";
import pm25Api from "@/services/pm25Api";

export function usePM25() {
  const store = usePM25Store();

  const fetchActual = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await pm25Api.getActualLatest();
      store.setActualData(data);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Gagal memuat data aktual");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchActualByDate = useCallback(
    async (date: string) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const data = await pm25Api.getActualByDate(date);
        store.setActualData(data);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : "Gagal memuat data aktual");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  const fetchPrediction = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await pm25Api.getPredictionLatest();
      store.setPredictionData(data);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Gagal memuat prediksi");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchPredictionByDate = useCallback(
    async (date: string) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const data = await pm25Api.getPredictionByDate(date);
        store.setPredictionData(data);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : "Gagal memuat prediksi");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  const selectStation = useCallback(
    (name: string) => {
      store.setSelectedStation(name);
    },
    [store],
  );

  return {
    actualData: store.actualData,
    predictionData: store.predictionData,
    selectedStation: store.selectedStation,
    isLoading: store.isLoading,
    error: store.error,
    fetchActual,
    fetchActualByDate,
    fetchPrediction,
    fetchPredictionByDate,
    selectStation,
  };
}
