import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.API_BASE_URL ?? "https://api-capstone.thelunareix.my.id";
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

  if (data && !data.error && Array.isArray(data)) {
    const STATION_COORDS: Record<string, [number, number]> = {
      "us_embassy_1": [-6.1811056, 106.8279877],
      "us_embassy_2": [-6.2366587, 106.7931975],
      "jakarta_gbk": [-6.2155, 106.803],
      "bundaran_hi": [-6.19466, 106.8235],
      "kelapa_gading": [-6.1535777, 106.910887],
      "jagakarsa": [-6.35693, 106.80367],
      "lubang_buaya": [-6.28889, 106.90919],
      "kebun_jeruk": [-6.20737, 106.7525],
    };

    const geojsonData = {
      type: "FeatureCollection",
      features: data.map((item: any) => {
        const coords = STATION_COORDS[item.station_name] || [0, 0];
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [coords[1], coords[0]]
          },
          properties: {
            pm25_value: item.pm25_value,
            station_name: item.station_name,
            date: item.date
          }
        };
      })
    };

    return NextResponse.json(geojsonData, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
