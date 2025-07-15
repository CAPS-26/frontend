import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api2/weather/datapm25/` : "http://127.0.0.1:8000/api2/weather/datapm25/";

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    const rawText = await response.text();

    // Ganti semua 'NaN' dengan null agar valid JSON
    const cleanText = rawText.replace(/NaN/g, "null");

    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error("PM25 Proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Gagal memuat data PM2.5",
        message,
      },
      { status: 500 }
    );
  }
}
