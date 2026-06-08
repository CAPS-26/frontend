import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api2/weather/weatherdata-now/` : "http://127.0.0.1:8000/api2/weather/weatherdata-now/";
        const response = await fetch(apiUrl, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const rawText = await response.text();
        const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Weather Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data cuaca", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
