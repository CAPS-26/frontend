import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:1963";
  const apiUrl = `${base}/api/v1/weather/pm25/prediction/`;
  const response = await fetch(apiUrl, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Server error" }));
    return NextResponse.json(err, { status: response.status,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
  }
  const rawText = await response.text();
  const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));

  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
