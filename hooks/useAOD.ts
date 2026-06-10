"use client";

import { useCallback } from "react";
import { useMapStore } from "@/stores";
import aodApi from "@/services/aodApi";

export function useAOD() {
  const store = useMapStore();

  const fetchLatestPolygon = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    store.setGeoData(null);
    try {
      const data = await aodApi.getLatestPolygon();
      if (!data.features?.length) throw new Error("Tidak ditemukan data");
      store.setGeoData(data);
    } catch (err) {
      store.setGeoData(null);
      store.setError(err instanceof Error ? err.message : "Gagal memuat data AOD");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchPolygonByDate = useCallback(
    async (tanggal: string) => {
      store.setLoading(true);
      store.setError(null);
      store.setGeoData(null);
      try {
        const data = await aodApi.getPolygonByDate(tanggal);
        if (!data.features?.length) throw new Error("Tidak ditemukan data");
        store.setGeoData(data);
      } catch (err) {
        store.setGeoData(null);
        store.setError(err instanceof Error ? err.message : "Tidak ditemukan data pada tanggal ini");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  const fetchPM25Polygon = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    store.setGeoData(null);
    try {
      const data = await aodApi.getPM25PolygonLatest();
      if (!data.features?.length) throw new Error("Tidak ditemukan data");
      store.setGeoData(data);
    } catch (err) {
      store.setGeoData(null);
      store.setError(err instanceof Error ? err.message : "Gagal memuat estimasi PM2.5");
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchPM25PolygonByDate = useCallback(
    async (tanggal: string) => {
      store.setLoading(true);
      store.setError(null);
      store.setGeoData(null);
      try {
        const data = await aodApi.getPM25PolygonByDate(tanggal);
        if (!data.features?.length) throw new Error("Tidak ditemukan data");
        store.setGeoData(data);
      } catch (err) {
        store.setGeoData(null);
        store.setError(err instanceof Error ? err.message : "Tidak ditemukan data pada tanggal ini");
      } finally {
        store.setLoading(false);
      }
    },
    [store],
  );

  return {
    geoData: store.geoData,
    boundaryData: store.boundaryData,
    selectedDate: store.selectedDate,
    isLoading: store.isLoading,
    error: store.error,
    markerPosition: store.markerPosition,
    setDataType: store.setDataType,
    setBoundaryData: store.setBoundaryData,
    setSelectedDate: store.setSelectedDate,
    setMarkerPosition: store.setMarkerPosition,
    clearMarker: store.clearMarker,
    fetchLatestPolygon,
    fetchPolygonByDate,
    fetchPM25Polygon,
    fetchPM25PolygonByDate,
  };
}
