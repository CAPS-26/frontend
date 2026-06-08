import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api1/get-data-aod/` : "http://127.0.0.1:8000/api1/get-data-aod/";
        const response = await fetch(apiUrl, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();


    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("AOD Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data AOD", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
