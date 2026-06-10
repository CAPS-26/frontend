"use client";

import { useCallback } from "react";
import { usePredictionStore } from "@/stores";
import predictionApi from "@/services/predictionApi";

export function usePrediction() {
  const store = usePredictionStore();

  const fetchLatest = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await predictionApi.getLatest();
      store.setData(data);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Gagal memuat prediksi");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchByDate = useCallback(
    async (tanggal: string) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const data = await predictionApi.getByDate(tanggal);
        store.setData(data);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : "Gagal memuat prediksi");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  const triggerPrediction = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await predictionApi.trigger();
      store.setJobId(res.job_id);
      store.setJobStatus("queued");
      return res;
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Gagal trigger prediksi");
      return null;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const pollJobStatus = useCallback(
    async (jobId: string, intervalMs = 2000, maxAttempts = 30) => {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const status = await predictionApi.getJobStatus(jobId);
          store.setJobStatus(status.status);
          if (status.status === "complete" || status.status === "failed") {
            return status;
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      store.setJobStatus("timeout");
      return null;
    },
    [store],
  );

  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
    jobId: store.jobId,
    jobStatus: store.jobStatus,
    fetchLatest,
    fetchByDate,
    triggerPrediction,
    pollJobStatus,
  };
}
