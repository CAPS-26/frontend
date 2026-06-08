"use client";

import Navbar from "@/components/navbar/Navbar";
import Map from "@/components/pm25-prediksi/Map";

export default function PM25PrediksiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Map />
      </main>
    </div>
  );
}
