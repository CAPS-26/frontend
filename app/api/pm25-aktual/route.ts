import { NextResponse } from "next/server";

export async function GET() {
  try {
    const base = process.env.API_BASE_URL ?? "http://127.0.0.1:1963";
    const apiUrl = `${base}/api/v1/weather/pm25/actual/`;
    const response = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Server error" }));
      return NextResponse.json(err, { status: response.status });
    }
    const rawText = await response.text();
    const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));

    return NextResponse.json(data);
  } catch (error) {
    console.error("PM25 Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data PM2.5", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
