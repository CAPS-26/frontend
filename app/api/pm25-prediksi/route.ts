import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
      const apiUrl = `${base}/api1/get-data-pm25-prediksi/`;
      const response = await fetch(apiUrl, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const rawText = await response.text();
      const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
