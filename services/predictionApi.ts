import http from "./http";
import type { PM25Data } from "@/app/types";

export interface TriggerPredictionResponse {
  status: string;
  message: string;
  job_id: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  result?: unknown;
}

const predictionApi = {
  getLatest: () =>
    http.get<PM25Data[]>("/api/v1/weather/pm25/prediction/").then((r) => r.data),

  getByDate: (tanggal: string) =>
    http
      .post<PM25Data[]>("/api/v1/weather/pm25/prediction/by-date/", {
        date: tanggal,
      })
      .then((r) => r.data),

  trigger: () =>
    http
      .post<TriggerPredictionResponse>("/api/v1/ingestion/pm25-prediction/trigger")
      .then((r) => r.data),

  getJobStatus: (jobId: string) =>
    http
      .get<JobStatusResponse>(`/api/v1/ingestion/jobs/${jobId}`)
      .then((r) => r.data),
};

export default predictionApi;
