import { NextResponse } from "next/server";

export async function POST() {
  const base = process.env.API_BASE_URL ?? "https://api-capstone.thelunareix.my.id";
  const apiUrl = `${base}/api/v1/ingestion/pm25-prediction/trigger`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: `Server error: ${response.status}` },
      { status: response.status },
    );
  }
  const data = await response.json();
  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
