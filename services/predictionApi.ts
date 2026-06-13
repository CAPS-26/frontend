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
    http.get<PM25Data[]>("/api/pm25-prediksi").then((r) => r.data),

  getByDate: (tanggal: string) =>
    http.post<PM25Data[]>("/api/pm25-prediksi/stasiun-by-date", { date: tanggal }).then((r) => r.data),

  trigger: () =>
    http.post<TriggerPredictionResponse>("/api/prediction/trigger").then((r) => r.data),

  getJobStatus: (jobId: string) =>
    http.get<JobStatusResponse>(`/api/prediction/job/${jobId}`).then((r) => r.data),
};

export default predictionApi;
