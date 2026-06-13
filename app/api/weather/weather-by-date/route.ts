import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const [year, month, day] = date.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    const apiUrl = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api/v1/weather/weather/by-date/` : "https://api-capstone.thelunareix.my.id/api/v1/weather/weather/by-date/";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formattedDate }),
          cache: "no-store",
        });
        if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Server error" }));
      return NextResponse.json(err, { status: response.status });
    }
    // fallback(`Server error: ${response.status}`);
        const rawText = await response.text();
        const data = JSON.parse(rawText.replace(/NaN/g, "null").replace(/"0"/g, "null"));


    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Weather History Proxy error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data historis cuaca", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
