import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api2/weather/datapm25/` : "http://127.0.0.1:8000/api2/weather/datapm25/";
        const response = await fetch(apiUrl, {
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const rawText = await response.text();
        const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


    return NextResponse.json(data);
  } catch (error) {
    console.error("PM25 Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data PM2.5", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
