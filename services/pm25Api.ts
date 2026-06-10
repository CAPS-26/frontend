import http from "./http";
import type { PM25Data, StationData } from "@/app/types";

const pm25Api = {
  getActualLatest: () =>
    http.get<PM25Data[]>("/api/v1/weather/pm25/actual/").then((r) => r.data),

  getActualByDate: (date: string) =>
    http
      .post<PM25Data[]>("/api/v1/weather/pm25/actual/by-date/", { date })
      .then((r) => r.data),

  getPredictionLatest: () =>
    http.get<PM25Data[]>("/api/v1/weather/pm25/prediction/").then((r) => r.data),

  getPredictionByDate: (date: string) =>
    http
      .post<PM25Data[]>("/api/v1/weather/pm25/prediction/by-date/", { date })
      .then((r) => r.data),
};

export default pm25Api;
