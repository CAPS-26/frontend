"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/navbar/Navbar";

const Calendar = dynamic(() => import("@/components/calendar/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary-blue/30 border-t-primary-blue animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Memuat kalender...</span>
      </div>
    </div>
  ),
});

export default function CalendarPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Calendar />
      </main>
    </div>
  );
}
