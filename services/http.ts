import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:1963";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (response) => {
    if (typeof response.data === "string") {
      const clean = response.data
        .replace(/NaN/g, "null")
        .replace(/"0"/g, "null");
      response.data = JSON.parse(clean);
    }
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export default http;
