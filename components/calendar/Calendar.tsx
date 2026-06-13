"use client";

import React, { useState, useCallback, useMemo } from "react";
import styles from "@/styles/calendar.module.css";
import Image from "next/image";
import { staticPM25Color } from "@/utils/color";
import { formatLocalDate, getDayDataKind, isFutureDate } from "@/lib/date";
import { usePM25Actual, usePM25Batch, usePredictionBatch, useWeatherByDate } from "@/hooks/queries";
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

  const monthDates = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const dates: { date: Date; str: string; kind: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const ds = formatLocalDate(d);
      if (ds === todayStr) continue;
      dates.push({ date: d, str: ds, kind: isFutureDate(d) ? "future" : "past" });
    }
    return dates;
  }, [currentMonth, currentYear, todayStr]);

  const pastDates = monthDates.filter((d) => d.kind === "past").map((d) => d.str);
  const futureDates = monthDates.filter((d) => d.kind === "future").map((d) => d.str);

  const historicalResults = usePM25Batch(pastDates);
  const predictionResults = usePredictionBatch(futureDates);
  const { data: weatherData } = useWeatherByDate(selectedDateStr);

  // Collect PM2.5 data from all queries
  const pm25Data = useMemo(() => {
    const all: PM25Data[] = [...realtimeData];
    for (const r of historicalResults) {
      if (r.data && Array.isArray(r.data)) all.push(...r.data);
    }
    return all;
  }, [realtimeData, historicalResults]);

  const predictionData = useMemo(() => {
    const all: PM25Data[] = [];
    for (const r of predictionResults) {
      if (r.data && Array.isArray(r.data)) all.push(...r.data);
    }
    return all;
  }, [predictionResults]);

  const isLoading = historicalResults.some((r) => r.isLoading) || predictionResults.some((r) => r.isLoading);

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
    if (pmValue <= 55.4) return "Boleh beraktivitas di luar dengan masker";
    if (pmValue <= 150.4) return "Hindari aktivitas luar terlalu lama, gunakan masker";
    if (pmValue <= 250.4) return "Batasi aktivitas luar, gunakan masker N95";
    return "Hindari semua aktivitas di luar rumah";
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }, []);

  const formatStationName = useCallback((name: string): string => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

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
    const names = [...new Set([...pm25Data, ...predictionData].map((d) => d?.station_name).filter(Boolean))];
    return names.length > 0 ? names : [DEFAULT_STATION];
  }, [pm25Data, predictionData]);

  const selectedPMValue = getPM25Value(selectedDate);
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStation = e.target.value;
    setSelectedStation(newStation);
    onStationChange?.(newStation);
  };

  const weatherStation = (Array.isArray(weatherData) ? weatherData.find((s: WeatherData) => s.station_name === selectedStation) : null) || (Array.isArray(weatherData) ? weatherData[0] : null);

  return (
    <div className={`${styles.container} ${isSplitView ? styles.isSplitView : ""} ${splitViewContainer || ""}`}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.location}>
            <p className={styles.stationLabel}>Pilih stasiun</p>
            <div className={styles.locationWrapper}>
              <div className={styles.locationIcon}>📍</div>
              <select value={selectedStation} onChange={handleDropdownChange} className={styles.stationSelector}>
                {stationNames.map((name) => (
                  <option key={name} value={name}>{formatStationName(name)}</option>
                ))}
              </select>
            </div>
          </div>
          <h2 className={styles.date}>
            Data PM2.5 (µg/m³) —{" "}
            <span className={styles.kindBadge} data-kind={getDayDataKind(selectedDate)}>
              {getDayDataKind(selectedDate) === "future" ? "Prediksi" : getDayDataKind(selectedDate) === "today" ? "Hari ini (Aktual)" : "Aktual"}
            </span>{" "}
            pada <span style={{ fontWeight: "bold" }}>{formatDate(selectedDate)}</span>
          </h2>
          <div className={styles.calendarLegend}>
            <span><i className={styles.dotPast} /> Masa lalu (aktual)</span>
            <span><i className={styles.dotToday} /> Hari ini</span>
            <span><i className={styles.dotFuture} /> Masa depan (prediksi)</span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className={styles.monthYearSelector}>
                <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className={styles.monthSelector}>
                  {MONTHS.map((month, index) => (<option key={month} value={index}>{month}</option>))}
                </select>
                <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className={styles.yearSelector}>
                  {Array.from({ length: 12 }, (_, i) => currentYear - 5 + i).map((year) => (<option key={year} value={year}>{year}</option>))}
                </select>
              </div>
            </div>
            <div className={styles.calendarGrid}>
              {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
                <div key={day} className={styles.dayName}>{day.substring(0, 3)}</div>
              ))}
              {calendarDays.map((dayData, index) => (
                <div
                  key={index}
                  className={`${styles.dayCell} ${dayData.day ? "" : styles.otherMonthDay} ${isCurrentMonth && dayData.day === today.getDate() ? styles.today : ""} ${
                    dayData.day && selectedDate.getDate() === dayData.day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear ? styles.selectedDate : ""
                  } ${dayData.day && getDayDataKind(new Date(currentYear, currentMonth, dayData.day)) === "future" ? styles.futureDay : ""}`}
                  onClick={() => dayData.day && handleDateClick(dayData.day)}
                  style={{ cursor: dayData.day ? "pointer" : "default" }}
                >
                  {dayData.day && (
                    <>
                      <div className={styles.dateNumber}>{dayData.day}</div>
                      <div className={styles.indikatorPMContainer}>
                        <div className={styles.indikatorPM} style={{ backgroundColor: staticPM25Color(dayData.pm25) }}>
                          <span className={styles.pmValue}>{dayData.pm25 !== null ? Math.round(dayData.pm25) : "-"}</span>
                        </div>
                        <div className={styles.dataLabel}>{getDayLabel(new Date(currentYear, currentMonth, dayData.day), dayData.pm25)}</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {showRightPanel && (
          <div className={styles.right}>
            <div className={styles.informationPM}>
              <div className={styles.qualityBox}>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className={styles.spinner}></div>
                    <span style={{ color: "black" }}>Memuat data PM2.5...</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.qualityBoxIndicator}>
                      <Image src={getPMImage(selectedPMValue)} alt="indikator kualitas udara" width={70} height={70} />
                      <div>
                        <p style={{ fontSize: "25px", fontWeight: "bolder" }}>{selectedPMValue !== null ? selectedPMValue.toFixed(1) : "N/A"}</p>
                        <p style={{ fontSize: "15px" }}>µg/m³</p>
                      </div>
                    </div>
                    <p>Kategori</p>
                    <strong>
                      {selectedPMValue === null ? "DATA TIDAK TERSEDIA" : selectedPMValue <= 15.4 ? "BAIK" : selectedPMValue <= 55.4 ? "SEDANG" : selectedPMValue <= 150.4 ? "TIDAK SEHAT" : selectedPMValue <= 250.4 ? "SANGAT TIDAK SEHAT" : "BERBAHAYA"}
                    </strong>
                  </>
                )}
              </div>
              <div className={styles.activityRec}>
                <b>Kegiatan yang direkomendasikan</b>
                <p>{getActivityRecommendation(selectedPMValue)}</p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>Sumber: udara.jakarta.go.id</p>
              </div>
            </div>
            <div className={styles.legend}>
              <h3>Keterangan (µg/m³)</h3>
              <div className={styles.legendGrid}>
                <div className={styles.legendHeader}><span>Konsentrasi</span><span>Kualitas</span><span>Deskripsi</span></div>
                {[
                  { range: "0-15.4", color: staticPM25Color(15.4), label: "Baik", desc: "Tingkat kualitas udara yang tidak memberikan efek bagi kesehatan manusia atau hewan dan tidak berpengaruh pada tumbuhan, bangunan ataupun nilai estetika" },
                  { range: "15.5-55.4", color: staticPM25Color(55.4), label: "Sedang", desc: "Tingkat kualitas udara yang tidak berpengaruh pada kesehatan manusia ataupun hewan tetapi berpengaruh pada tumbuhan yang sensitif, dan nilai estetika" },
                  { range: "55.5-150.4", color: staticPM25Color(150.4), label: "Tidak Sehat", desc: "Tingkat kualitas udara yang bersifat merugikan pada manusia ataupun kelompok hewan yang sensitif atau bisa menimbulkan kerusakan pada tumbuhan ataupun nilai estetika" },
                  { range: "150.5-250.4", color: staticPM25Color(250.4), label: "Sangat Tidak Sehat", desc: "Tingkat kualitas udara yang dapat merugikan kesehatan pada sejumlah segmen populasi yang terpapar" },
                  { range: ">250.4", color: staticPM25Color(250.5), label: "Berbahaya", desc: "Tingkat kualitas udara berbahaya yang secara umum dapat merugikan kesehatan yang serius pada populasi" },
                ].map((item, index) => (
                  <div key={index} className={styles.legendItem}><span>{item.range}</span><span style={{ backgroundColor: item.color }}>{item.label}</span><span>{item.desc}</span></div>
                ))}
              </div>
            </div>
            <div className={styles.weather}>
              <div className={styles.weatherHeader}><h3>Data Cuaca {selectedDate.getDate() === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear() ? "Hari Ini" : formatDate(selectedDate)}</h3></div>
              <table>
                <thead><tr><th>Suhu (°C)</th><th>Curah hujan (mm)</th><th>Kelembaban (%)</th><th>Arah angin (°)</th><th>Kec. angin (m/s)</th></tr></thead>
                <tbody>
                  {weatherStation ? (
                    <tr><td>{weatherStation.temperature?.toFixed(1)}</td><td>{weatherStation.precipitation?.toFixed(1)}</td><td>{weatherStation.humidity?.toFixed(1)}</td><td>{weatherStation.wind_dir?.toFixed(1)}</td><td>{weatherStation.wind_speed?.toFixed(1)}</td></tr>
                  ) : (
                    <tr><td colSpan={5}>Data cuaca tidak tersedia</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
