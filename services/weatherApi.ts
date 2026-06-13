import http from "./http";
import type { WeatherData } from "@/app/types";

const weatherApi = {
  getLatest: () =>
    http.get<WeatherData[]>("/api/weather").then((r) => r.data),

  getByDate: (date: string) =>
    http.post<WeatherData[]>("/api/weather/weather-by-date", { date }).then((r) => r.data),
};

export default weatherApi;
