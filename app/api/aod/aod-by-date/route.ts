import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const { tanggal } = await request.json();
    if (!tanggal) {
      return NextResponse.json({ error: "Tanggal is required" }, { status: 400 });
    }

    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api1/get-data-aodbydate/` : "http://127.0.0.1:8000/api1/get-data-aodbydate/";
    
    console.log("API_BASE_URL:", process.env.API_BASE_URL);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ tanggal }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const rawText = await response.text();
    const cleanText = rawText.replace(/NaN/g, "null");
    const data = JSON.parse(cleanText);
    console.log("API Proxy AOD by date data sample:", JSON.stringify(data).slice(0, 300));

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("AOD History Proxy error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat data historis AOD",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
