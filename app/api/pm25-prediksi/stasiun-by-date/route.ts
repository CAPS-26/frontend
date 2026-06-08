import { NextResponse } from "next/server";

/** Data prediksi per stasiun (untuk kalender) */
export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
        const apiUrl = `${base}/api2/weather/datapm25-prediksi-bydate/`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const rawText = await response.text();
        const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


    return NextResponse.json(data);
  } catch (error) {
    console.error("PM25 Prediksi stasiun error:", error);
    return NextResponse.json({ error: "Gagal memuat prediksi stasiun" }, { status: 500 });
  }
}
