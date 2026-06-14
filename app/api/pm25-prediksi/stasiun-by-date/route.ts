import { NextResponse } from "next/server";

/** Data prediksi per stasiun (untuk kalender) */
export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const [year, month, day] = date.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    const base = process.env.API_BASE_URL ?? "https://api-capstone.thelunareix.my.id";
        const apiUrl = `${base}/api/v1/weather/pm25/prediction/by-date/`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formattedDate }),
          cache: "no-store",
        });
        if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      const err = await response.json().catch(() => ({ detail: "Server error" }));
      return NextResponse.json(err, { status: response.status });
    }
    // fallback(`Server error: ${response.status}`);
        const rawText = await response.text();
        const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


    return NextResponse.json(data);
  } catch (error) {
    console.error("PM25 Prediksi stasiun error:", error);
    return NextResponse.json({ error: "Gagal memuat prediksi stasiun" }, { status: 500 });
  }
}
