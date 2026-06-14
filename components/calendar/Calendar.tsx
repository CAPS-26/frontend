"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { staticPM25Color } from "@/utils/color";
import { formatLocalDate, getDayDataKind, isFutureDate } from "@/lib/date";
import { usePM25Actual, usePM25ActualHistory, usePM25PredictionHistory, useWeatherByDate } from "@/hooks/queries";
import type { PM25Data, WeatherData } from "@/app/types";

interface CalendarProps {
  location?: string;
  isSplitView?: boolean;
  showRightPanel?: boolean;
  splitViewContainer?: string;
  onStationChange?: (stationName: string) => void;
  onDateChange?: (date: Date) => void;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DEFAULT_STATION = "bundaran_hi";
const ALL_STATIONS = [
  "us_embassy_1", "us_embassy_2", "jakarta_gbk", "bundaran_hi",
  "kelapa_gading", "jagakarsa", "lubang_buaya", "kebun_jeruk",
];

const Calendar: React.FC<CalendarProps> = ({ location, isSplitView = false, showRightPanel = true, splitViewContainer, onStationChange, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedStation, setSelectedStation] = useState<string>(location || DEFAULT_STATION);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedDateStr = formatLocalDate(selectedDate);
  const today = new Date();
  const todayStr = formatLocalDate(today);

  // TanStack Query hooks — auto cache, dedup, retry
  const { data: realtimeData = [] } = usePM25Actual();

  const { data: historicalData = [] } = usePM25ActualHistory();
  const { data: predictionData = [] } = usePM25PredictionHistory();
  const { data: weatherData } = useWeatherByDate(selectedDateStr);

  // Collect PM2.5 data from all queries
  const pm25Data = useMemo(() => {
    const all: PM25Data[] = Array.isArray(realtimeData) ? [...realtimeData] : [];
    if (Array.isArray(historicalData)) {
      all.push(...historicalData);
    }
    return all;
  }, [realtimeData, historicalData]);

  const hasData = pm25Data.length > 0 || predictionData.length > 0;

  const getPM25Value = useCallback(
    (date: Date) => {
      const dateString = formatLocalDate(date);
      const kind = getDayDataKind(date);
      const source = kind === "future" ? predictionData : pm25Data;
      const stationData = source.find((item) => item.date === dateString && item.station_name === selectedStation);
      return stationData?.pm25_value ?? null;
    },
    [pm25Data, predictionData, selectedStation],
  );

  const getPMImage = useCallback((value: number | null): string => {
    if (value === null) return "/images/indikator_tidak_tersedia.png";
    if (value <= 15.4) return "/images/indikator_baik.png";
    if (value <= 55.4) return "/images/indikator_sedang.png";
    if (value <= 150.4) return "/images/indikator_tidak_sehat.png";
    if (value <= 250.4) return "/images/indikator_sangat_tidak_sehat.png";
    return "/images/indikator_berbahaya.png";
  }, []);

  const getActivityRecommendation = useCallback((pmValue: number | null): string => {
    if (pmValue === null) return "Data kualitas udara tidak tersedia";
    if (pmValue <= 15.4) return "Aman untuk beraktivitas di luar rumah";
    if (pmValue <= 55.4) return "Boleh beraktivitas di luar dengan menggunakan masker";
    if (pmValue <= 150.4) return "Batasi aktivitas fisik yang berat atau lama di luar ruangan, selalu gunakan masker";
    if (pmValue <= 250.4) return "Kurangi aktivitas di luar ruangan secara signifikan, gunakan masker standar N95";
    return "Hindari segala jenis aktivitas di luar rumah dan jaga sirkulasi udara tertutup";
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }, []);

  const STATION_LABELS: Record<string, string> = {
    us_embassy_1: "US Embassy 1",
    us_embassy_2: "US Embassy 2",
    jakarta_gbk: "Jakarta GBK",
    bundaran_hi: "Bundaran HI",
    kelapa_gading: "Kelapa Gading",
    jagakarsa: "Jagakarsa",
    lubang_buaya: "Lubang Buaya",
    kebun_jeruk: "Kebun Jeruk",
  };

  const formatStationName = (name: string): string => {
    return STATION_LABELS[name] || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleDateClick = useCallback(
    (day: number) => {
      const clickedDate = new Date(currentYear, currentMonth, day);
      setSelectedDate(clickedDate);
      onDateChange?.(clickedDate);
    },
    [currentMonth, currentYear, onDateChange],
  );

  const getDayLabel = useCallback((date: Date, pm25: number | null): string => {
    if (pm25 === null) return "No Data";
    const kind = getDayDataKind(date);
    if (kind === "future") return "Prediksi";
    if (kind === "today") return "Hari ini";
    return "Aktual";
  }, []);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfWeek = getFirstDayOfMonth(currentMonth, currentYear);
    const days: { day: number | null; pm25: number | null }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push({ day: null, pm25: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ day, pm25: getPM25Value(date) });
    }
    return days;
  }, [currentMonth, currentYear, getPM25Value]);

  const stationNames = useMemo(() => {
    const fromData = [...new Set([...pm25Data, ...predictionData].map((d) => d?.station_name).filter(Boolean))];
    const merged = [...new Set([...ALL_STATIONS, ...fromData])];
    return merged.length > 0 ? merged : ALL_STATIONS;
  }, [pm25Data, predictionData]);

  const selectedPMValue = getPM25Value(selectedDate);
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStation = e.target.value;
    setSelectedStation(newStation);
    onStationChange?.(newStation);
  };

  const weatherStation = (Array.isArray(weatherData) ? weatherData.find((s: WeatherData) => s.station_name === selectedStation) : null) || (Array.isArray(weatherData) ? weatherData[0] : null);

  const containerClass = isSplitView
    ? `h-full overflow-y-auto bg-transparent p-0 mt-0 ${splitViewContainer || ""}`
    : "w-full min-h-screen bg-slate-50 py-24 px-4 sm:px-6 lg:px-8";

  const contentClass = isSplitView
    ? "flex flex-col gap-6"
    : "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8";

  const leftClass = isSplitView ? "w-full" : "lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm";
  const rightClass = isSplitView ? "w-full" : "lg:col-span-5 flex flex-col gap-6";

  const getHeroCardClasses = (value: number | null): string => {
    if (value === null || isNaN(value)) {
      return "bg-grey-gradient shadow-gray-500/15 text-white";
    }
    if (value <= 15.4) {
      return "bg-green-gradient shadow-green-500/15 text-white";
    }
    if (value <= 55.4) {
      return "bg-blue-gradient shadow-blue-500/15 text-white";
    }
    if (value <= 150.4) {
      return "bg-yellow-gradient shadow-yellow-500/15 text-white";
    }
    if (value <= 250.4) {
      return "bg-red-gradient shadow-red-500/15 text-white";
    }
    return "bg-black-gradient shadow-gray-950/15 text-white";
  };

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Left Section - Calendar control and grid */}
        <div className={leftClass}>
          
          {/* Station selector & Month/Year selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pilih Stasiun Pemantau</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm">📍</span>
                <select
                  value={selectedStation}
                  onChange={handleDropdownChange}
                  className="pl-9 pr-10 py-2.5 w-full sm:w-64 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue appearance-none transition-all duration-200"
                >
                  {stationNames.map((name) => (
                    <option key={name} value={name}>{formatStationName(name)}</option>
                  ))}
                </select>
                <span className="absolute right-3 pointer-events-none text-gray-400 text-[10px]">▼</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition-all duration-200"
              >
                {MONTHS.map((month, index) => (<option key={month} value={index}>{month}</option>))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition-all duration-200"
              >
                {Array.from({ length: 12 }, (_, i) => currentYear - 5 + i).map((year) => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
          </div>

          {/* Selected day indicator header */}
          <div className="mb-4 space-y-2 pb-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-800 flex flex-wrap items-center gap-2 leading-tight">
              <span>Data PM2.5 pada</span>
              <span className="text-primary-blue font-extrabold">{formatDate(selectedDate)}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                getDayDataKind(selectedDate) === "future" 
                  ? "bg-purple-50 text-purple-700 border border-purple-100" 
                  : getDayDataKind(selectedDate) === "today" 
                    ? "bg-blue-50 text-blue-700 border border-blue-100" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}>
                {getDayDataKind(selectedDate) === "future" ? "Prediksi (LSTM)" : getDayDataKind(selectedDate) === "today" ? "Hari ini (Aktual)" : "Aktual"}
              </span>
            </h2>
            
            {/* Calendar indicators */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Aktual (Masa Lalu)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Hari Ini</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-dashed border-purple-700" /> Prediksi (Masa Depan)</span>
            </div>
          </div>

          {/* Calendar grid */}
          <div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <div key={day} className="text-center font-bold text-xs text-gray-400 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((dayData, index) => {
                const isSelected = dayData.day && selectedDate.getDate() === dayData.day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
                const isToday = isCurrentMonth && dayData.day === today.getDate();
                const dayKind = dayData.day ? getDayDataKind(new Date(currentYear, currentMonth, dayData.day)) : null;
                const isFuture = dayKind === "future";
                
                return (
                  <div
                    key={index}
                    className={`relative flex flex-col items-center justify-between p-1.5 sm:p-2 min-h-[76px] sm:min-h-[84px] rounded-xl border transition-all duration-200 ${
                      dayData.day 
                        ? isSelected 
                          ? "border-primary-blue bg-blue-50/20 ring-2 ring-primary-blue/20"
                          : isToday
                            ? "border-emerald-500 bg-emerald-50/10 shadow-sm"
                            : isFuture
                              ? "border-purple-200 border-dashed bg-purple-50/20 hover:border-purple-300 hover:bg-purple-50/40"
                              : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                        : "bg-gray-50/50 border-transparent opacity-40 cursor-not-allowed"
                    }`}
                    onClick={() => dayData.day && handleDateClick(dayData.day)}
                    style={{ cursor: dayData.day ? "pointer" : "default" }}
                  >
                    {dayData.day ? (
                      <>
                        <div className="w-full flex justify-between items-start">
                          <span className={`text-xs font-bold ${
                            isSelected 
                              ? "text-primary-blue" 
                              : isToday 
                                ? "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100" 
                                : "text-gray-700"
                          }`}>
                            {dayData.day}
                          </span>
                          {isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center gap-1 w-full">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm"
                            style={{ backgroundColor: staticPM25Color(dayData.pm25) }}
                          >
                            {dayData.pm25 !== null ? Math.round(dayData.pm25) : "-"}
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-bold text-gray-400">
                            {getDayLabel(new Date(currentYear, currentMonth, dayData.day), dayData.pm25)}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section - Air Quality Details and Weather stats */}
        {showRightPanel && (
          <div className={rightClass}>
            
            {/* Air quality hero card with dynamic color gradient */}
            <div className={`${getHeroCardClasses(selectedPMValue)} rounded-2xl p-6 shadow-lg flex flex-col gap-6`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
                {!hasData ? (
                  <div className="w-full flex items-center justify-center gap-3 py-4">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span className="font-semibold text-sm">Memuat data PM2.5...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Kategori Kualitas Udara</span>
                      <h3 className="text-2xl font-black tracking-wide">
                        {selectedPMValue === null ? "DATA TIDAK TERSEDIA" : selectedPMValue <= 15.4 ? "BAIK" : selectedPMValue <= 55.4 ? "SEDANG" : selectedPMValue <= 150.4 ? "TIDAK SEHAT" : selectedPMValue <= 250.4 ? "SANGAT TIDAK SEHAT" : "BERBAHAYA"}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image src={getPMImage(selectedPMValue)} alt="indikator kualitas" fill className="object-contain" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black leading-none">{selectedPMValue !== null ? selectedPMValue.toFixed(1) : "N/A"}</p>
                        <p className="text-[10px] font-bold text-blue-100 uppercase mt-0.5">µg/m³ PM2.5</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-100">Rekomendasi Aktivitas</h4>
                <p className="text-sm font-semibold leading-relaxed">
                  {getActivityRecommendation(selectedPMValue)}
                </p>
                <p className="text-[10px] text-blue-200/80">Sumber resmi: udara.jakarta.go.id</p>
              </div>
            </div>

            {/* PM2.5 Index scale descriptions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Keterangan Indeks PM2.5 (µg/m³)</h3>
              <div className="space-y-4">
                {[
                  { range: "0 - 15.4", color: staticPM25Color(15.4), label: "Baik", desc: "Kualitas udara sangat baik, tidak memberikan dampak negatif bagi kesehatan manusia, hewan, maupun lingkungan sekitar." },
                  { range: "15.5 - 55.4", color: staticPM25Color(55.4), label: "Sedang", desc: "Kualitas udara dapat diterima, namun beberapa polutan mungkin menimbulkan risiko bagi kelompok orang tertentu yang sensitif." },
                  { range: "55.5 - 150.4", color: staticPM25Color(150.4), label: "Tidak Sehat", desc: "Kelompok sensitif dapat mengalami efek kesehatan, sementara masyarakat umum berisiko mengalami iritasi pernapasan." },
                  { range: "150.5 - 250.4", color: staticPM25Color(250.4), label: "Sangat Tidak Sehat", desc: "Seluruh populasi mulai merasakan dampak kesehatan yang lebih signifikan, disarankan membatasi aktivitas berat di luar ruangan." },
                  { range: "> 250.4", color: staticPM25Color(250.5), label: "Berbahaya", desc: "Peringatan darurat kesehatan! Seluruh lapisan masyarakat berpotensi terdampak serius dan harus menghindari semua aktivitas luar." },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-24 flex-shrink-0 flex flex-col items-center gap-1">
                      <span 
                        className="w-full text-center text-xs font-black text-white px-2 py-1 rounded-lg shadow-sm"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.label}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">{item.range}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed flex-grow">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather parameters stats grid */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Data Parameter Cuaca
                </h3>
                <span className="text-xs font-semibold text-gray-500">
                  {selectedDate.getDate() === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear() ? "Hari Ini" : formatDate(selectedDate)}
                </span>
              </div>

              {weatherStation ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "Suhu", value: weatherStation.temperature !== null && weatherStation.temperature !== undefined ? `${weatherStation.temperature.toFixed(1)}°C` : "-", icon: "🌡️" },
                    { label: "Hujan", value: weatherStation.precipitation !== null && weatherStation.precipitation !== undefined ? `${weatherStation.precipitation.toFixed(1)} mm` : "-", icon: "🌧️" },
                    { label: "Kelembaban", value: weatherStation.humidity !== null && weatherStation.humidity !== undefined ? `${weatherStation.humidity.toFixed(0)}%` : "-", icon: "💧" },
                    { label: "Arah Angin", value: weatherStation.wind_dir !== null && weatherStation.wind_dir !== undefined ? `${weatherStation.wind_dir.toFixed(0)}°` : "-", icon: "🧭" },
                    { label: "Kec. Angin", value: weatherStation.wind_speed !== null && weatherStation.wind_speed !== undefined ? `${weatherStation.wind_speed.toFixed(1)} m/s` : "-", icon: "💨" },
                  ].map((item, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-100/50 rounded-xl p-2.5 text-center space-y-1">
                      <span className="text-base">{item.icon}</span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-black text-gray-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 text-center text-xs font-semibold text-gray-400 border border-dashed border-gray-200">
                  ⚠️ Data cuaca tidak tersedia untuk tanggal ini
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
