import { shouldUseDummyData } from "@/lib/config";

type FetchOptions = RequestInit & { timeoutMs?: number };

export async function fetchBackend(url: string, options?: FetchOptions): Promise<Response> {
  const { timeoutMs = 8000, ...init } = options ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBackendJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetchBackend(url, options);
  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }
  const rawText = await response.text();
  const cleanText = rawText.replace(/NaN/g, "null").replace(/"0"/g, "null");
  return JSON.parse(cleanText) as T;
}

export async function resolveWithDummy<T>(dummy: () => T, backend: () => Promise<T>): Promise<T> {
  if (shouldUseDummyData()) {
    return dummy();
  }
  try {
    return await backend();
  } catch (err) {
    console.warn("[API] Backend gagal, fallback ke dummy:", err);
    return dummy();
  }
}
