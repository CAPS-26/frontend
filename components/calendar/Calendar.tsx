"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "@/styles/calendar.module.css";
import Image from "next/image";
import { staticPM25Color } from "@/utils/color";
import { formatLocalDate, getDayDataKind, isFutureDate } from "@/lib/date";
interface PM25Data {
  id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  date: string;
  pm25_value: number | null;
  station: number;
}

interface WeatherData {
  id: number;
  temperature: number;
  precipitation: number;
  humidity: number;
  wind_dir: number;
  wind_speed: number;
  station_name: string;
  latitude: number;
  longitude: number;
}

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
  const [pm25Data, setPM25Data] = useState<PM25Data[]>([]);
  const [predictionData, setPredictionData] = useState<PM25Data[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>(location || DEFAULT_STATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (location && location !== selectedStation) {
      setSelectedStation(location);
      console.log(`Syncing selectedStation to prop location: ${location}`);
    }
  }, [location, selectedStation]);

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

  const handleDateClick = useCallback(
    (day: number) => {
      const clickedDate = new Date(currentYear, currentMonth, day);
      setSelectedDate(clickedDate);
      if (onDateChange) {
        onDateChange(clickedDate);
      }
    },
    [currentMonth, currentYear, onDateChange]
  );

  const formatDate = useCallback((date: Date): string => {
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  const formatStationName = useCallback((name: string): string => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const fetchRealtimePM25Data = useCallback(async () => {
    try {
      const response = await fetch("/api/pm25-aktual", { cache: "no-store" });
      if (!response.ok) {
        console.warn(`Failed to fetch real-time PM2.5 data: ${response.status}`);
        return []; // Kembalikan array kosong jika gagal
      }
      const data = await response.json();
      if (data.error) {
        console.warn(`Error in real-time PM2.5 data: ${data.error}`);
        return []; // Kembalikan array kosong jika ada error dari server
      }
      return Array.isArray(data) ? data : []; // Pastikan data adalah array
    } catch (err) {
      console.error("Error fetching real-time PM2.5 data:", err);
      return []; // Kembalikan array kosong jika terjadi error
    }
  }, []);

  const fetchHistoricalPM25Data = useCallback(async (date: string) => {
    try {
      const response = await fetch("/api/pm25-aktual/pm25-aktual-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!response.ok) {
        console.warn(`Failed to fetch historical PM2.5 data for ${date}: ${response.status}`);
        return [];
      }
      const data = await response.json();
      if (data.error) {
        console.warn(`Error in historical PM2.5 data: ${data.error}`);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Error fetching historical PM2.5 data for ${date}:`, err);
      return [];
    }
  }, []);

  const fetchPredictionPM25Data = useCallback(async (date: string) => {
    try {
      const response = await fetch("/api/pm25-prediksi/stasiun-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (data.error) return [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Error fetching prediction for ${date}:`, err);
      return [];
    }
  }, []);

  const fetchWeatherData = useCallback(
    async (date: string) => {
      setIsWeatherLoading(true);
      setWeatherError(null);
      try {
        const isToday = date === formatLocalDate(new Date()) && new Date(date).getDate() === new Date().getDate() && new Date(date).getMonth() === new Date().getMonth() && new Date(date).getFullYear() === new Date().getFullYear();

        const url = isToday ? "/api/weather" : "/api/weather/weather-by-date";
        const body = isToday ? undefined : JSON.stringify({ date });

        const response = await fetch(url, {
          method: isToday ? "GET" : "POST",
          headers: { "Content-Type": "application/json" },
          body,
          cache: "no-store",
        });

        if (!response.ok) {
          console.warn(`Failed to fetch weather data for ${date}: ${response.status}`);
          throw new Error(`Gagal memuat data cuaca tanggal ${date}`);
        }
        const data = await response.json();
        if (data.error) {
          console.warn(`Error in weather data: ${data.error}`);
          throw new Error(data.error || "Gagal memuat data cuaca");
        }
        return data;
      } catch (error) {
        setWeatherError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data cuaca");
        return null;
      } finally {
        setIsWeatherLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWeatherData(formatLocalDate(selectedDate)).then((data) => {
      if (data) {
        const station = data.find((s: WeatherData) => s.station_name === selectedStation) || data[0];
        setWeatherData(station);
      }
    });
  }, [selectedDate, selectedStation, fetchWeatherData]);

  const loadDataForMonth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      const todayStr = formatLocalDate(today);
      const realtimeData = await fetchRealtimePM25Data();

      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      const datesToFetch: string[] = [];

      const futureDatesToFetch: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatLocalDate(date);
        if (dateStr === todayStr) continue;
        if (isFutureDate(date)) {
          futureDatesToFetch.push(dateStr);
        } else {
          datesToFetch.push(dateStr);
        }
      }

      let historicalData: PM25Data[] = [];
      if (datesToFetch.length > 0) {
        const responses = await Promise.all(datesToFetch.map((date) => fetchHistoricalPM25Data(date)));
        historicalData = responses.flat();
      }

      let futurePredData: PM25Data[] = [];
      if (futureDatesToFetch.length > 0) {
        const predResponses = await Promise.all(futureDatesToFetch.map((date) => fetchPredictionPM25Data(date)));
        futurePredData = predResponses.flat();
      }

      const combinedData = [...realtimeData, ...historicalData];
      setPM25Data(combinedData);
      setPredictionData(futurePredData);
    } catch (err) {
      console.error("Error loading PM2.5 data for month:", err);
      setError("Gagal memuat beberapa data PM2.5, tetapi kalender tetap ditampilkan.");
      setPM25Data([]); // Tetap set array kosong untuk memastikan kalender dirender
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear, fetchRealtimePM25Data, fetchHistoricalPM25Data, fetchPredictionPM25Data]);

  useEffect(() => {
    loadDataForMonth();
  }, [currentMonth, currentYear, selectedStation, loadDataForMonth]);

  const getPM25Value = useCallback(
    (date: Date) => {
      const dateString = formatLocalDate(date);
      const kind = getDayDataKind(date);
      const source = kind === "future" ? predictionData : pm25Data;
      if (!source.length) return null;
      const stationData = source.find((item) => item.date === dateString && item.station_name === selectedStation);
      return stationData?.pm25_value ?? null;
    },
    [pm25Data, predictionData, selectedStation]
  );

  const getDayLabel = useCallback(
    (date: Date, pm25: number | null): string => {
      if (pm25 === null) return "No Data";
      const kind = getDayDataKind(date);
      if (kind === "future") return "Prediksi";
      if (kind === "today") return "Hari ini";
      return "Aktual";
    },
    []
  );

  const generateCalendarData = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfWeek = getFirstDayOfMonth(currentMonth, currentYear);
    const days: { day: number | null; pm25: number | null }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, pm25: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const pm25 = getPM25Value(date);
      days.push({ day, pm25 });
    }

    return days;
  }, [currentMonth, currentYear, getPM25Value]);

  const stationNamesFromData = pm25Data
    .concat(predictionData)
    .map((item) => item?.station_name)
    .filter((name): name is string => !!name)
    .filter((name, index, self) => self.indexOf(name) === index);

  const stationNames =
    stationNamesFromData.length > 0 ? stationNamesFromData : [DEFAULT_STATION];

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStation = e.target.value;
    setSelectedStation(newStation);
    if (onStationChange) {
      onStationChange(newStation);
      console.log(`Dropdown changed to station: ${newStation}`);
    }
  };

  const calendarDays = generateCalendarData();
  const today = new Date();
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const selectedPMValue = getPM25Value(selectedDate);

  const renderQualityBox = () => {
    if (isLoading) {
      return (
        <div className={styles.qualityBox}>
          <div className="flex items-center justify-center gap-4">
            <div className={styles.spinner}></div>
            <span style={{ color: "black" }}>Memuat data PM2.5...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.qualityBox}>
          <div className={styles.error}>{error}</div>
        </div>
      );
    }

    return (
      <div className={styles.qualityBox}>
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
      </div>
    );
  };

  const renderLegend = () => (
    <div className={styles.legend}>
      <h3>Keterangan (µg/m³)</h3>
      <div className={styles.legendGrid}>
        <div className={styles.legendHeader}>
          <span>Konsentrasi</span>
          <span>Kualitas</span>
          <span>Deskripsi</span>
        </div>
        {[
          {
            range: "0-15.4",
            color: staticPM25Color(15.4),
            label: "Baik",
            desc: "Tingkat kualitas udara yang tidak memberikan efek bagi kesehatan manusia atau hewan dan tidak berpengaruh pada tumbuhan, bangunan ataupun nilai estetika",
          },
          {
            range: "15.5-55.4",
            color: staticPM25Color(55.4),
            label: "Sedang",
            desc: "Tingkat kualitas udara yang tidak berpengaruh pada kesehatan manusia ataupun hewan tetapi berpengaruh pada tumbuhan yang sensitif, dan nilai estetika",
          },
          {
            range: "55.5-150.4",
            color: staticPM25Color(150.4),
            label: "Tidak Sehat",
            desc: "Tingkat kualitas udara yang bersifat merugikan pada manusia ataupun kelompok hewan yang sensitif atau bisa menimbulkan kerusakan pada tumbuhan ataupun nilai estetika",
          },
          {
            range: "150.5-250.4",
            color: staticPM25Color(250.4),
            label: "Sangat Tidak Sehat",
            desc: "Tingkat kualitas udara yang dapat merugikan kesehatan pada sejumlah segmen populasi yang terpapar",
          },
          {
            range: ">250.4",
            color: staticPM25Color(250.5),
            label: "Berbahaya",
            desc: "Tingkat kualitas udara berbahaya yang secara umum dapat merugikan kesehatan yang serius pada populasi",
          },
        ].map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <span>{item.range}</span>
            <span style={{ backgroundColor: item.color }}>{item.label}</span>
            <span>{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeatherTable = () => (
    <div className={styles.weather}>
      <div className={styles.weatherHeader}>
        <h3>Data Cuaca {selectedDate.getDate() === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear() ? "Hari Ini" : formatDate(selectedDate)}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Suhu (°C)</th>
            <th>Curah hujan (mm)</th>
            <th>Kelembaban (%)</th>
            <th>Arah angin (°)</th>
            <th>Kec. angin (m/s)</th>
          </tr>
        </thead>
        <tbody>
          {isWeatherLoading ? (
            <tr>
              <td colSpan={5} className={styles.loadingRow}>
                <div className="flex items-center justify-center gap-4">
                  <div className={styles.spinner}></div>
                  <span style={{ color: "black" }}>Memuat data cuaca...</span>
                </div>
              </td>
            </tr>
          ) : weatherError ? (
            <tr>
              <td colSpan={5} className={styles.errorRow}>
                {weatherError}
              </td>
            </tr>
          ) : weatherData ? (
            <tr>
              <td>{weatherData.temperature.toFixed(1)}</td>
              <td>{weatherData.precipitation.toFixed(1)}</td>
              <td>{weatherData.humidity.toFixed(1)}</td>
              <td>{weatherData.wind_dir.toFixed(1)}</td>
              <td>{weatherData.wind_speed.toFixed(1)}</td>
            </tr>
          ) : (
            <tr>
              <td colSpan={5}>Data cuaca tidak tersedia</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`${styles.container} ${isSplitView ? styles.isSplitView : ""} ${splitViewContainer || ""}`}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.location}>
            <p className={styles.stationLabel}>Pilih stasiun</p>
            <div className={styles.locationWrapper}>
              <div className={styles.locationIcon}>📍</div>
              <select value={selectedStation} onChange={handleDropdownChange} className={styles.stationSelector} disabled={isLoading}>
                {stationNames.map((name) => (
                  <option key={name} value={name}>
                    {formatStationName(name)}
                  </option>
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
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className={styles.yearSelector}>
                  {Array.from({ length: 12 }, (_, i) => currentYear - 5 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.calendarGrid}>
              {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
                <div key={day} className={styles.dayName}>
                  {day.substring(0, 3)}
                </div>
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
                        <div
                          className={styles.indikatorPM}
                          style={{
                            backgroundColor: staticPM25Color(dayData.pm25),
                          }}
                        >
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
              {renderQualityBox()}
              <div className={styles.activityRec}>
                <b>Kegiatan yang direkomendasikan</b>
                <p>{getActivityRecommendation(selectedPMValue)}</p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>Sumber: udara.jakarta.go.id</p>
              </div>
            </div>
            {renderLegend()}
            {renderWeatherTable()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;