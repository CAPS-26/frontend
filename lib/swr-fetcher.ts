export const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `HTTP ${res.status}`);
  }
  const raw = await res.text();
  return JSON.parse(raw.replace(/NaN/g, "null").replace(/"0"/g, "null"));
};

export const postFetcher = async ([url, body]: [string, Record<string, unknown>]) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const b = await res.json().catch(() => null);
    throw new Error(b?.detail || `HTTP ${res.status}`);
  }
  const raw = await res.text();
  return JSON.parse(raw.replace(/NaN/g, "null").replace(/"0"/g, "null"));
};
