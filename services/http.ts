import axios, { AxiosError } from "axios";

const http = axios.create({
  baseURL: "",
  timeout: 10000,
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
