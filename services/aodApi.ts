import http from "./http";
import type { GeoJSONData } from "@/app/types";

const aodApi = {
  getLatestPolygon: () =>
    http.get<GeoJSONData>("/api/v1/aod/polygon/").then((r) => r.data),

  getPolygonByDate: (tanggal: string) =>
    http
      .post<GeoJSONData>("/api/v1/aod/polygon/by-date/", { tanggal })
      .then((r) => r.data),

  getPM25PolygonLatest: () =>
    http.get<GeoJSONData>("/api/v1/aod/pm25/polygon/").then((r) => r.data),

  getPM25PolygonByDate: (tanggal: string) =>
    http
      .post<GeoJSONData>("/api/v1/aod/pm25/polygon/by-date/", { tanggal })
      .then((r) => r.data),
};

export default aodApi;
