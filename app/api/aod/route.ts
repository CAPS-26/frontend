import { NextResponse } from "next/server";

export async function GET() {
  try {
    const base = process.env.API_BASE_URL ?? "https://api-capstone.thelunareix.my.id";
    const apiUrl = `${base}/api/v1/aod/polygon/`;
    const response = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Server error" }));
      return NextResponse.json(err, { status: response.status,
        headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" } });
    }
    const data = await response.json();

    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("AOD Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data AOD", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
