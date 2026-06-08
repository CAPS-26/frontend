import Navbar from "@/components/navbar/Navbar";
import Calendar from "@/components/calendar/Calendar";

export default function CalendarPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ paddingTop: "var(--header-offset, 64px)" }}>
      <Navbar />
      <main className="flex-grow">
        <Calendar />
      </main>
    </div>
  );
}
