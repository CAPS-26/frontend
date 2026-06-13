import http from "./http";
import type { PM25Data } from "@/app/types";

const pm25Api = {
  getActualLatest: () =>
    http.get<PM25Data[]>("/api/pm25-aktual").then((r) => r.data),

  getActualByDate: (date: string) =>
    http.post<PM25Data[]>("/api/pm25-aktual/pm25-aktual-by-date", { date }).then((r) => r.data),

  getPredictionLatest: () =>
    http.get<PM25Data[]>("/api/pm25-prediksi").then((r) => r.data),

  getPredictionByDate: (date: string) =>
    http.post<PM25Data[]>("/api/pm25-prediksi/stasiun-by-date", { date }).then((r) => r.data),
};

export default pm25Api;
