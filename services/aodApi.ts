import http from "./http";
import type { GeoJSONData } from "@/app/types";

const aodApi = {
  getLatestPolygon: () =>
    http.get<GeoJSONData>("/api/aod").then((r) => r.data),

  getPolygonByDate: (tanggal: string) =>
    http.post<GeoJSONData>("/api/aod/aod-by-date", { tanggal }).then((r) => r.data),

  getPM25PolygonLatest: () =>
    http.get<GeoJSONData>("/api/pm25-est").then((r) => r.data),

  getPM25PolygonByDate: (tanggal: string) =>
    http.post<GeoJSONData>("/api/pm25-est/pm25-est-by-date", { tanggal }).then((r) => r.data),
};

export default aodApi;
