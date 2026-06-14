import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/navbar/Navbar";
import { FiChevronRight } from "react-icons/fi";
import { staticPM25Color } from "@/utils/color";
import { BoundaryGeoJSONData, StationData, WeatherData, PM25Data } from "@/app/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBoundaryStyle } from "@/utils/map";

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

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

const Calendar = dynamic(() => import("@/components/calendar/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col gap-3 items-center justify-center bg-slate-50/50 p-6">
      <div className="w-8 h-8 rounded-full border-4 border-primary-blue/30 border-t-primary-blue animate-spin" />
      <span className="text-xs font-semibold text-gray-500">Memuat kalender...</span>
    </div>
  ),
});

const MapComponent = React.memo(
  ({
    stations,
    historicalData,
    boundaryJakarta,
    getIconByPM25,
    getWeatherForStation,
    handleMarkerClick,
    mapRef,
    selectedDate,
    selectedStation,
    activeMarkerRef,
  }: {
    stations: StationData[];
    historicalData: { pm25: PM25Data[]; weather: WeatherData[] };
    boundaryJakarta: BoundaryGeoJSONData | null;
    getIconByPM25: (pm25: number | null) => L.DivIcon;
    getWeatherForStation: (stationName: string) => WeatherData | undefined;
    handleMarkerClick: (station: StationData, layer: L.Marker) => void;
    mapRef: React.MutableRefObject<L.Map | null>;
    selectedDate: Date;
    selectedStation: string | null;
    activeMarkerRef: React.MutableRefObject<L.Marker | null>;
  }) => {
    const formatLocalDate = useCallback((date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }, []);

    const getPM25ForStation = useCallback(
      (stationName: string) => {
        const dateString = formatLocalDate(selectedDate);
        const stationData = historicalData.pm25.find((item) => item.date === dateString && item.station_name === stationName);
        return stationData?.pm25_value ?? null;
      },
      [historicalData.pm25, selectedDate, formatLocalDate]
    );

    useEffect(() => {
      if (mapRef.current && selectedStation && activeMarkerRef.current) {
        const pm25Value = getPM25ForStation(selectedStation);
        const weather = getWeatherForStation(selectedStation);
        const station = stations.find((s) => s.station_name === selectedStation);

        if (station) {
          const popupContent = `
            <div style="font-family: var(--font-poppins); padding: 4px; color: #1f2937;">
              <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px;">Stasiun: ${formatStationName(station.station_name)}</div>
              <div style="font-weight: 700; font-size: 13px; color: #4b5563; margin-bottom: 6px;">PM2.5: ${pm25Value !== null && !isNaN(pm25Value) ? `${pm25Value.toFixed(1)} µg/m³` : "Tidak tersedia"}</div>
              <div style="color: white; font-weight: 850; font-size: 11px; padding: 4px 8px; border-radius: 6px; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.1); background-color: ${staticPM25Color(pm25Value)}">
                ${
                  pm25Value === null || isNaN(pm25Value)
                    ? "Kualitas: Tidak tersedia"
                    : pm25Value <= 15.4
                    ? "Kualitas: BAIK"
                    : pm25Value <= 55.4
                    ? "Kualitas: SEDANG"
                    : pm25Value <= 150.4
                    ? "Kualitas: TIDAK SEHAT"
                    : pm25Value <= 250.4
                    ? "Kualitas: SANGAT TIDAK SEHAT"
                    : "Kualitas: BERBAHAYA"
                }
              </div>
              ${
                weather
                  ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #4b5563; line-height: 1.5;">
                     <div>Suhu: <strong>${weather.temperature?.toFixed(1) ?? "-"} °C</strong></div>
                     <div>Curah hujan: <strong>${weather.precipitation?.toFixed(1) ?? "-"} mm</strong></div>
                     <div>Kelembaban: <strong>${weather.humidity?.toFixed(0) ?? "-"} %</strong></div>
                     <div>Arah angin: <strong>${weather.wind_dir?.toFixed(0) ?? "-"}°</strong></div>
                     <div>Kec. angin: <strong>${weather.wind_speed?.toFixed(1) ?? "-"} m/s</strong></div>
                   </div>`
                  : `<div style="margin-top: 8px; font-size: 11px; font-style: italic; color: #9ca3af;">Data cuaca tidak tersedia</div>`
              }
            </div>
          `;
          activeMarkerRef.current.setPopupContent(popupContent);
          activeMarkerRef.current.openPopup();
          console.log(`Popup updated for station: ${selectedStation} on date: ${formatLocalDate(selectedDate)}`);
        }
      }
    }, [selectedDate, historicalData, selectedStation, getPM25ForStation, getWeatherForStation, stations, mapRef, activeMarkerRef, formatLocalDate]);

    const handleMapReady = useCallback(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        console.log("Map initialized and size invalidated");
      }
    }, [mapRef]);

    return (
      <MapContainer
        key={`map-${stations.length}`}
        center={[-6.1754, 106.8272]}
        zoom={12}
        minZoom={12}
        maxZoom={16}
        maxBounds={[
          [-6.45, 106.55],
          [-5.9, 107.15],
        ]}
        maxBoundsViscosity={1}
        className="h-full w-full relative z-0"
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={mapRef}
        whenReady={handleMapReady}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© <a href="https://carto.com/attributions">CartoDB</a> & <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
        {boundaryJakarta && <GeoJSON data={boundaryJakarta} style={getBoundaryStyle} />}
        {Array.isArray(stations) &&
          stations.length > 0 &&
          stations.map((station, index) => {
            const pm25Value = getPM25ForStation(station.station_name);
            const weather = getWeatherForStation(station.station_name);
            const icon = getIconByPM25(pm25Value);

            return (
              <Marker
                key={index}
                position={[station.latitude, station.longitude]}
                icon={icon}
                eventHandlers={{
                  click: (e) => handleMarkerClick(station, e.target),
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "var(--font-poppins)", padding: "4px", color: "#1f2937" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "2px" }}>Stasiun: {formatStationName(station.station_name)}</div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#4b5563", marginBottom: "6px" }}>PM2.5: {pm25Value !== null && !isNaN(pm25Value) ? `${pm25Value.toFixed(1)} µg/m³` : "Tidak tersedia"}</div>
                    <div style={{ color: "white", fontWeight: 850, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-block", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", backgroundColor: staticPM25Color(pm25Value) }}>
                      {pm25Value === null || isNaN(pm25Value)
                        ? "Kualitas: Tidak tersedia"
                        : pm25Value <= 15.4
                        ? "Kualitas: BAIK"
                        : pm25Value <= 55.4
                        ? "Kualitas: SEDANG"
                        : pm25Value <= 150.4
                        ? "Kualitas: TIDAK SEHAT"
                        : pm25Value <= 250.4
                        ? "Kualitas: SANGAT TIDAK SEHAT"
                        : "Kualitas: BERBAHAYA"}
                    </div>
                    {weather ? (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f3f4f6", fontSize: "11px", color: "#4b5563", lineHeight: 1.5 }}>
                        <div>Suhu: <strong>{weather.temperature?.toFixed(1) ?? "-"} °C</strong></div>
                        <div>Curah hujan: <strong>{weather.precipitation?.toFixed(1) ?? "-"} mm</strong></div>
                        <div>Kelembaban: <strong>{weather.humidity?.toFixed(0) ?? "-"} %</strong></div>
                        <div>Arah angin: <strong>{weather.wind_dir?.toFixed(0) ?? "-"}°</strong></div>
                        <div>Kec. angin: <strong>{weather.wind_speed?.toFixed(1) ?? "-"} m/s</strong></div>
                      </div>
                    ) : (
                      <div style={{ marginTop: "8px", fontSize: "11px", fontStyle: "italic", color: "#9ca3af" }}>Data cuaca tidak tersedia</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    );
  }
);
MapComponent.displayName = "MapComponent";

const StasiunPM25 = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [historicalData, setHistoricalData] = useState<{ pm25: PM25Data[]; weather: WeatherData[] }>({ pm25: [], weather: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundaryJakarta, setBoundaryJakarta] = useState<BoundaryGeoJSONData | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const createIcon = useCallback((pm25: number | null) => {
    const color = staticPM25Color(pm25);
    const value = pm25 !== null && !isNaN(pm25) ? pm25.toFixed(0) : "-";
    return L.divIcon({
      className: "custom-marker",
      html: `
          <div style="
            background-color: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border: 2px solid #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          ">
            ${value}
          </div>
        `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }, []);

  const getIconByPM25 = useCallback(
    (pm25: number | null): L.DivIcon => {
      return createIcon(pm25);
    },
    [createIcon]
  );

  const formatLocalDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const fetchRealtimeData = useCallback(async () => {
    try {
      const [pm25Response, weatherResponse, boundaryResponse] = await Promise.all([
        fetch("/api/pm25-aktual", { cache: "no-store" }),
        fetch("/api/weather", { cache: "no-store" }),
        fetch("/data/batas_kelurahan_jakarta.geojson", { cache: "no-store" }),
      ]);

      if (!pm25Response.ok) throw new Error(`PM2.5 fetch failed: ${pm25Response.status}`);
      const pm25RawText = await pm25Response.text();
      const pm25CleanText = pm25RawText.replace(/NaN/g, "null").replace(/"0"/g, "null");
      const pm25Data = JSON.parse(pm25CleanText);
      if (pm25Data.error) throw new Error(pm25Data.error || "Gagal memuat data PM2.5");

      if (Array.isArray(pm25Data)) {
        setStations(
          pm25Data.map((item: PM25Data) => ({
            station_name: item.station_name,
            latitude: item.latitude,
            longitude: item.longitude,
            pm25_value: item.pm25_value,
          }))
        );
        setHistoricalData((prev) => ({ ...prev, pm25: pm25Data }));
      } else {
        setStations([]);
        throw new Error(pm25Data.message?.includes("Tidak ada data PM2.5") ? "Tidak ada data PM2.5 tersedia" : "Gagal memuat data stasiun");
      }

      if (!weatherResponse.ok) throw new Error(`Weather fetch failed: ${weatherResponse.status}`);
      const weatherData = await weatherResponse.json();
      if (weatherData.error) throw new Error(weatherData.error || "Gagal memuat data cuaca");
      setHistoricalData((prev) => ({ ...prev, weather: Array.isArray(weatherData) ? weatherData : [] }));

      if (!boundaryResponse.ok) throw new Error(`Boundary fetch failed: ${boundaryResponse.status}`);
      const boundaryData = await boundaryResponse.json();
      if (boundaryData.error) throw new Error(boundaryData.error || "Gagal memuat data batas wilayah");
      setBoundaryJakarta(boundaryData);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError((err as Error).message || "Terjadi kesalahan saat memuat data peta");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistoricalData = useCallback(
    async (date: Date) => {
      const dateString = formatLocalDate(date);
      const isToday = dateString === formatLocalDate(new Date());

      if (isToday) {
        await fetchRealtimeData();
        return;
      }

      try {
        const [pm25Response, weatherResponse] = await Promise.all([
          fetch("/api/pm25-aktual/pm25-aktual-by-date", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateString }),
          }),
          fetch("/api/weather/weather-by-date", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateString }),
          }),
        ]);

        if (!pm25Response.ok) throw new Error(`Terjadi kesalahan saat memuat data PM2.5 untuk tanggal ${dateString}`);
        const pm25Data = await pm25Response.json();
        if (pm25Data.error) throw new Error(pm25Data.error || "Gagal memuat data historis PM2.5");
        setHistoricalData((prev) => ({ ...prev, pm25: Array.isArray(pm25Data) ? pm25Data : [] }));

        if (!weatherResponse.ok) throw new Error(`Terjadi kesalahan saat memuat data cuaca untuk tanggal ${dateString}`);
        const weatherData = await weatherResponse.json();
        if (weatherData.error) throw new Error(weatherData.error || "Gagal memuat data historis cuaca");
        setHistoricalData((prev) => ({ ...prev, weather: Array.isArray(weatherData) ? weatherData : [] }));

        setError(null);
      } catch (err) {
        console.error("Terjadi kesalahan saat memuat data historis", err);
        setError((err as Error).message || "Terjadi kesalahan saat memuat data historis");
      }
    },
    [formatLocalDate, fetchRealtimeData]
  );

  useEffect(() => {
    setIsClient(true);
    fetchRealtimeData();
  }, [fetchRealtimeData]);

  useEffect(() => {
    fetchHistoricalData(selectedDate);
  }, [selectedDate, fetchHistoricalData]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
          console.log("Map instance cleaned up");
        } catch (err) {
          console.error("Error during map cleanup:", err);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log(`Map invalidated size due to split view change: isSplitView=${isSplitView}`);
          if (isSplitView && selectedStation && activeMarkerRef.current) {
            activeMarkerRef.current.openPopup();
            console.log(`Popup opened for station: ${selectedStation} after invalidateSize`);
          }
        }
      }, 300);
    }
  }, [isSplitView, selectedStation]);

  const getWeatherForStation = useCallback(
    (stationName: string) => {
      return historicalData.weather.find((w) => w.station_name === stationName);
    },
    [historicalData.weather]
  );

  const handleMarkerClick = useCallback(
    (station: StationData, layer: L.Marker) => {
      setSelectedStation(station.station_name);
      activeMarkerRef.current = layer;
      setIsSplitView(true);
      if (mapRef.current) {
        mapRef.current.setView([station.latitude, station.longitude], 14);
        console.log(`Map view set to station: ${station.station_name}, center: [${station.latitude}, ${station.longitude}]`);
      }
    },
    [mapRef]
  );

  const handleStationChange = useCallback(
    (stationName: string) => {
      const selected = stations.find((s) => s.station_name === stationName);
      if (selected && mapRef.current) {
        setSelectedStation(stationName);
        mapRef.current.setView([selected.latitude, selected.longitude], 14);
        console.log(`Station changed from dropdown: ${stationName}, center: [${selected.latitude}, ${selected.longitude}]`);
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const latlng = layer.getLatLng();
            if (latlng.lat === selected.latitude && latlng.lng === selected.longitude) {
              activeMarkerRef.current = layer;
              layer.openPopup();
              console.log(`Popup opened for station: ${stationName} from dropdown`);
            }
          }
        });
      }
    },
    [stations, mapRef]
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      console.log(`Date changed to: ${formatLocalDate(date)}`);
    },
    [formatLocalDate]
  );

  const toggleSplitView = useCallback(() => {
    setIsSplitView((prev) => {
      if (prev) {
        setSelectedStation(null);
        activeMarkerRef.current = null;
        setSelectedDate(new Date());
        fetchRealtimeData();
        console.log("Split view closed, resetting selected station, marker, and date to today");
      } else {
        if (!selectedStation) {
          const defaultStation = stations.find((s) => s.station_name === "bundaran_hi");
          if (defaultStation && mapRef.current) {
            setSelectedStation("bundaran_hi");
            mapRef.current.setView([defaultStation.latitude, defaultStation.longitude], 14);
            mapRef.current.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                const latlng = layer.getLatLng();
                if (latlng.lat === defaultStation.latitude && latlng.lng === defaultStation.longitude) {
                  activeMarkerRef.current = layer;
                  layer.openPopup();
                  console.log("Popup opened for default station: bundaran_hi");
                }
              }
            });
          }
        }
      }
      return !prev;
    });
  }, [selectedStation, stations, mapRef, fetchRealtimeData]);

  const handleInfoClick = () => {
    setShowInfoPopup(true);
  };

  const handleClosePopup = () => {
    setShowInfoPopup(false);
  };

  const memoizedMap = useMemo(
    () => (
      <MapComponent
        stations={stations}
        historicalData={historicalData}
        boundaryJakarta={boundaryJakarta}
        getIconByPM25={getIconByPM25}
        getWeatherForStation={getWeatherForStation}
        handleMarkerClick={handleMarkerClick}
        mapRef={mapRef}
        selectedDate={selectedDate}
        selectedStation={selectedStation}
        activeMarkerRef={activeMarkerRef}
      />
    ),
    [stations, historicalData, boundaryJakarta, getIconByPM25, getWeatherForStation, handleMarkerClick, selectedDate, selectedStation]
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-blue/30 border-t-primary-blue animate-spin" />
          <span className="text-sm font-semibold text-gray-500">Memuat peta...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-blue/30 border-t-primary-blue animate-spin" />
          <span className="text-sm font-semibold text-gray-500">Memuat data stasiun...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`relative min-h-screen w-full flex ${isSplitView ? "flex-row" : "flex-col"}`}>
        {error && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1200] bg-white border border-red-100 rounded-xl p-4 shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <span className="text-red-500 text-sm font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 focus:outline-none transition-colors">
              Tutup
            </button>
          </div>
        )}
        <div className={`flex w-full h-screen ${isSplitView ? "flex-row" : "flex-col"}`}>
          <div className={`${isSplitView ? "w-1/2" : "w-full"} h-full relative`} ref={containerRef}>
            {memoizedMap}
            
            {/* Information Button */}
            <div className="absolute bottom-[13rem] left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-150 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all duration-200" onClick={handleInfoClick}>
              <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-gray-700">Informasi Data PM2.5 (Aktual)</span>
            </div>
            
            {showInfoPopup && (
              <div className="absolute bottom-[16.5rem] left-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xl z-[1100] max-w-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Data PM2.5 (Aktual)</h4>
                  <button className="text-gray-400 hover:text-gray-600 font-extrabold text-sm" onClick={handleClosePopup}>
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Data PM2.5 (Aktual) merupakan data PM2.5 resmi yang diperoleh dari 8 Stasiun Pemantauan Kualitas Udara (SPKU) di Jakarta. Data ini memiliki tingkat akurasi sensor stasiun darat yang tinggi.
                </p>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs space-y-2.5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Indikator PM2.5 (µg/m³)</h4>
              <div className="space-y-1.5">
                {[
                  { label: "Baik", range: "0 - 15.4", color: "#00CC00" },
                  { label: "Sedang", range: "15.5 - 55.4", color: "#0133FF" },
                  { label: "Tidak Sehat", range: "55.5 - 150.4", color: "#FFC900" },
                  { label: "Sangat Tidak Sehat", range: "150.5 - 250.4", color: "#FF0000" },
                  { label: "Berbahaya", range: "> 250.4", color: "#000000" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      {item.label} <span className="text-gray-400 font-normal">({item.range})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Calendar splitscreen side */}
          {isSplitView && selectedStation && (
            <div className="w-1/2 h-full overflow-auto bg-slate-50 border-l border-gray-100 px-6 pb-6 pt-20">
              <Calendar location={selectedStation} isSplitView={true} showRightPanel={false} onStationChange={handleStationChange} onDateChange={handleDateChange} />
            </div>
          )}
          
          {/* Splitscreen collapse/expand button */}
          <button 
            onClick={toggleSplitView} 
            className={`absolute top-1/2 -translate-y-1/2 bg-primary-blue hover:bg-primary-dark text-white p-3 rounded-full z-[1000] shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center ${
              isSplitView ? "left-[calc(50%-20px)]" : "right-4"
            }`}
            title={isSplitView ? "Tutup Kalender" : "Buka Kalender"}
          >
            <FiChevronRight size={20} className={isSplitView ? "" : "rotate-180"} />
          </button>
        </div>
      </div>
    </>
  );
};

export default StasiunPM25;
