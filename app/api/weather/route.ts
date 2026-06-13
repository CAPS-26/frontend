import { NextResponse } from "next/server";

export async function GET() {
  try {
    const base = process.env.API_BASE_URL ?? "https://api-capstone.thelunareix.my.id";
    const apiUrl = `${base}/api/v1/weather/weather/`;
    const response = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Server error" }));
      return NextResponse.json(err, { status: response.status,
        headers: { "Access-Control-Allow-Origin": "*" } });
    }
    const rawText = await response.text();
    const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));
    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Weather Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data cuaca", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
