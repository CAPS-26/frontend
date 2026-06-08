"use client";

import dynamic from "next/dynamic";

const GenericMap = dynamic(() => import("@/components/map/GenericMap"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center gap-3 pt-20">
      <div className="spinner" />
      <span>Memuat peta prediksi...</span>
    </div>
  ),
});

export default function Map() {
  return (
    <GenericMap
      dataType="pm25-pred"
      fetchUrl="/api/pm25-prediksi"
      fetchByDateUrl="/api/pm25-prediksi/pm25-prediksi-by-date"
      legendTitle="Prediksi PM2.5 (µg/m³)"
      maxFutureDays={14}
    />
  );
}
