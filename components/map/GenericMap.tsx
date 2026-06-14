"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import GenericHeatMapLayer from "@/components/map/GenericHeatMapLayer";
import SearchBar from "@/components/aod/SearchBar";
import { GeoJSONData, BoundaryGeoJSONData } from "@/app/types";
import * as GeoJSONTypes from "geojson";
import * as L from "leaflet";
import { getBoundaryStyle } from "@/utils/map";
import * as turf from "@turf/turf";
import { interpolateAODColor, interpolatePM25Color } from "@/utils/color";

const customIcon = L.icon({
  iconUrl: "/images/marker_lokasi.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

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

const formatStationName = (name: string): string => {
  return STATION_LABELS[name] || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getNearestStationName = (latlng: L.LatLng): string => {
  let closestName = "Stasiun";
  let minDist = Infinity;
  for (const [name, coords] of Object.entries(STATION_COORDS)) {
    const dist = latlng.distanceTo(L.latLng(coords[0], coords[1]));
    if (dist < minDist) {
      minDist = dist;
      closestName = name;
    }
  }
  return closestName;
};

const createModernPinpoint = (value: number | null, label: string, dataType: MapDataType) => {
  const formattedText = value !== null 
    ? (dataType === "aod" ? value.toFixed(2) : value.toFixed(0)) 
    : "-";

  return L.divIcon({
    className: "custom-modern-pinpoint",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer;">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0, 91, 227, 0.35));">
          <defs>
            <linearGradient id="pinpoint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#239CFF" />
              <stop offset="100%" stop-color="#005BE3" />
            </linearGradient>
          </defs>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(#pinpoint-grad)"/>
          <circle cx="12" cy="9" r="3" fill="#ffffff" />
        </svg>
        <div style="
          position: absolute;
          top: -10px;
          background-color: #ffffff;
          color: #1e293b;
          font-weight: 800;
          font-size: 9px;
          padding: 2.5px 6.5px;
          border-radius: 20px;
          border: 1.5px solid #005BE3;
          box-shadow: 0px 2px 4px rgba(0,0,0,0.1);
          white-space: nowrap;
          pointer-events: none;
        ">
          ${formattedText}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 38],
    popupAnchor: [0, -36],
  });
};


const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export type MapDataType = "aod" | "pm25-est" | "pm25-pred";

interface GenericMapProps {
  dataType: MapDataType;
  fetchUrl: string;
  fetchByDateUrl: string;
  legendTitle: string;
  /** Batas hari ke depan untuk pemilih tanggal (prediksi). Default 14. */
  maxFutureDays?: number;
}

const GenericMap: React.FC<GenericMapProps> = ({ dataType, fetchUrl, fetchByDateUrl, legendTitle, maxFutureDays = 14 }) => {
  const mapRef = useRef<L.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [boundaryData, setBoundaryData] = useState<BoundaryGeoJSONData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);

  const updateMarker = (latlng: L.LatLng) => {
    setMarkerPosition(latlng);
  };

  const resetMap = useCallback(() => {
    setMarkerPosition(null);
    if (mapRef.current) {
      mapRef.current.setView([-6.1754, 106.8272], 12);
    }
  }, []);

  const getTooltipContent = (value: number | null, kelurahanName: string): string => {
    const formattedValue = value !== null && value > 0 ? (dataType === "aod" ? value.toFixed(4) : value.toFixed(2)) : "No data";
    const color = value !== null && value > 0 ? (dataType === "aod" ? interpolateAODColor(value) : interpolatePM25Color(value)) : "rgba(160, 174, 192, 0.85)";
    const textColor = dataType === "aod" ? "#ffffff" : "#000000";
    return `
      <div class="customTooltip">
        <div class="kelurahanName">${kelurahanName}</div>
        <div class="valueContainer">
          <div class="valueCircle" style="background-color: ${color}; color: ${textColor}">
            ${formattedValue} ${dataType === "aod" || formattedValue === "No data" ? "" : "µg/m³"}
          </div>
        </div>
      </div>
    `;
  };

  const fetchData = useCallback(
    async (url: string, date?: string) => {
      setIsLoading(true);
      setError(null);
      setGeoData(null);
      try {
        const body = date ? JSON.stringify({ tanggal: date.split("-").reverse().join("-") }) : undefined;
        const response = await fetch(url, {
          method: date ? "POST" : "GET",
          headers: date ? { "Content-Type": "application/json" } : undefined,
          body,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Tidak ditemukan data pada tanggal ini");
        }

        const rawText = await response.text();
        // const cleanText = rawText.replace(/NaN/g, "null");
        const cleanText = rawText.replace(/NaN/g, "null").replace(/"0"/g, "null");
        const data = JSON.parse(cleanText);

        if (data.error) {
          throw new Error("Tidak ditemukan data pada tanggal ini");
        }

        if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
          throw new Error("Tidak ditemukan data pada tanggal ini");
        }

        const allZero = data.features.every((f: GeoJSONTypes.Feature<GeoJSONTypes.Point, { aod_value?: number; pm25_value?: number }>) => {
          const value = dataType === "aod" ? f.properties?.aod_value : f.properties?.pm25_value;
          return value === 0;
        });

        if (allZero) {
          throw new Error("Data pada hari ini bernilai 0.0");
        }

        const validFeatures = data.features.filter((f: GeoJSONTypes.Feature<GeoJSONTypes.Point, { aod_value?: number; pm25_value?: number }>) => {
          const value = dataType === "aod" ? f.properties?.aod_value : f.properties?.pm25_value;
          return f.geometry && value !== null && value !== undefined && !isNaN(value);
        });

        if (validFeatures.length === 0) {
          throw new Error("Data pada hari ini bernilai 0.0");
        }

        setGeoData({ ...data, features: validFeatures });
      } catch (err) {
        setGeoData(null);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      } finally {
        setIsLoading(false);
      }
    },
    [dataType]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [, boundary] = await Promise.all([fetchData(fetchUrl), fetch("/data/batas_kelurahan_jakarta.geojson", { cache: "no-store" })]);
        if (!boundary.ok) throw new Error(`Gagal memuat batas  wilayah`);
        const boundaryData = await boundary.json();
        setBoundaryData(boundaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      }
    };

    loadData();
  }, [fetchUrl, dataType, fetchData]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error("Error during map cleanup:", err);
        }
      }
    };
  }, []);

  useEffect(() => {
    setMarkerPosition(null); // Reset marker saat tanggal berubah
  }, [selectedDate]);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    const today = new Date().toISOString().split("T")[0];
    const url = date === today ? fetchUrl : fetchByDateUrl;
    await fetchData(url, date === today ? undefined : date);
  };

  const handleMapReady = () => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <div className="absolute left-4 z-[1000]" style={{ top: "var(--header-offset, 64px)" }}>
        <SearchBar updateMarker={updateMarker} mapRef={mapRef} boundaryData={boundaryData} resetMap={resetMap} />
      </div>
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-red-100 text-red-600 p-4 rounded-md shadow-md flex items-center gap-4">
          <span>{error}</span>
        </div>
      )}
      <MapContainer
        center={[-6.1754, 106.8272]}
        zoom={12}
        minZoom={12}
        maxZoom={16}
        maxBounds={[
          [-6.45, 106.55],
          [-5.9, 107.15],
        ]}
        maxBoundsViscosity={1}
        className="h-full w-full"
        style={{ height: "100vh", width: "100%", minHeight: "400px" }}
        zoomControl={false}
        ref={mapRef}
        whenReady={() => {
          console.log("MapContainer rendered");
          handleMapReady();
        }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© <a href="https://carto.com/attributions">CartoDB</a> & <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
        {boundaryData && !error && (
          <GeoJSON
            data={boundaryData}
            style={getBoundaryStyle}
            onEachFeature={(feature, layer: L.GeoJSON) => {
              layer.on({
                mouseover: (e: L.LeafletMouseEvent) => {
                  if (error) return;

                  const turfPoint = turf.point([e.latlng.lng, e.latlng.lat]);
                  const dataFeature = geoData?.features.find((f: GeoJSONTypes.Feature) => {
                    if (!f.geometry) return false;
                    try {
                      if (f.geometry.type === "Point") {
                        return false;
                      }
                      return turf.booleanPointInPolygon(turfPoint, f.geometry as any);
                    } catch {
                      return false;
                    }
                  });

                  const value = dataFeature ? (dataType === "aod" ? dataFeature.properties.aod_value ?? null : dataFeature.properties.pm25_value ?? null) : null;
                  
                  // Skip highlighting and tooltips if there's no valid data (null or zero)
                  if (value === null || value <= 0) {
                    return;
                  }

                  layer.setStyle({
                    weight: 1.2,
                    color: "#1a4971",
                    fillOpacity: 0.1,
                  });
                  layer.bringToFront();

                  const kelurahanName = feature.properties?.NAMOBJ || "Lokasi Tidak Dikenal";

                  if (tooltipRef.current) {
                    tooltipRef.current.remove();
                    tooltipRef.current = null;
                  }

                  tooltipRef.current = L.tooltip({
                    sticky: true,
                    direction: "top",
                    offset: [0, -20],
                    className: "customTooltip",
                  })
                    .setLatLng(e.latlng)
                    .setContent(getTooltipContent(value, kelurahanName))
                    .addTo(mapRef.current!);
                },
                mouseout: () => {
                  if (error) return;
                  layer.setStyle(getBoundaryStyle());
                  if (tooltipRef.current) {
                    tooltipRef.current.remove();
                    tooltipRef.current = null;
                  }
                },
              });
            }}
          />
        )}
        <GenericHeatMapLayer
          dataType={dataType}
          geoData={geoData}
          boundaryData={boundaryData}
          selectedDate={selectedDate}
          setSelectedDate={handleDateChange}
          isLoading={isLoading}
          legendTitle={legendTitle}
          inputRef={inputRef}
          fetchUrl={fetchUrl}
          fetchByDateUrl={fetchByDateUrl}
          maxFutureDays={maxFutureDays}
        />
        {geoData && geoData.features.map((feature, index) => {
          let latlng: L.LatLng | null = null;
          if (feature.geometry.type === "Point") {
            const coords = feature.geometry.coordinates;
            latlng = L.latLng(coords[1], coords[0]);
          } else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            try {
              const centroid = turf.centroid(feature as any);
              const coords = centroid.geometry.coordinates;
              latlng = L.latLng(coords[1], coords[0]);
            } catch (err) {
              console.error("Error calculating centroid:", err);
              return null;
            }
          }
          if (!latlng) return null;

          const value = dataType === "aod" ? (feature.properties as any)?.aod_value ?? null : (feature.properties as any)?.pm25_value ?? null;
          const rawName = (feature.properties as any)?.station_name ?? null;
          const name = rawName || getNearestStationName(latlng);
          const icon = createModernPinpoint(value, name, dataType);
          const formattedName = formatStationName(name);

          return (
            <Marker key={index} position={latlng} icon={icon}>
              <Popup>
                <div style={{ fontFamily: "var(--font-poppins)", padding: "4px", color: "#1f2937" }}>
                  <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "2px" }}>Stasiun: {formattedName}</div>
                  
                  {dataType === "aod" ? (
                    <>
                      <div style={{ fontWeight: 750, fontSize: "13px", color: "#4b5563", marginBottom: "6px" }}>AOD: {value !== null ? value.toFixed(4) : "Tidak tersedia"}</div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-block", backgroundColor: interpolateAODColor(value) }}>
                        Nilai: {value !== null ? value.toFixed(4) : "Tidak tersedia"}
                      </div>
                    </>
                  ) : dataType === "pm25-est" ? (
                    <>
                      <div style={{ fontWeight: 750, fontSize: "13px", color: "#4b5563", marginBottom: "6px" }}>Estimasi PM2.5: {value !== null ? `${value.toFixed(1)} µg/m³` : "Tidak tersedia"}</div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-block", backgroundColor: interpolatePM25Color(value) }}>
                        Kualitas: {
                          value === null ? "Tidak tersedia"
                          : value <= 15.4 ? "BAIK"
                          : value <= 55.4 ? "SEDANG"
                          : value <= 150.4 ? "TIDAK SEHAT"
                          : value <= 250.4 ? "SANGAT TIDAK SEHAT"
                          : "BERBAHAYA"
                        }
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 750, fontSize: "13px", color: "#4b5563", marginBottom: "6px" }}>Prediksi PM2.5: {value !== null ? `${value.toFixed(1)} µg/m³` : "Tidak tersedia"}</div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-block", backgroundColor: interpolatePM25Color(value) }}>
                        Kualitas: {
                          value === null ? "Tidak tersedia"
                          : value <= 15.4 ? "BAIK"
                          : value <= 55.4 ? "SEDANG"
                          : value <= 150.4 ? "TIDAK SEHAT"
                          : value <= 250.4 ? "SANGAT TIDAK SEHAT"
                          : "BERBAHAYA"
                        }
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {markerPosition && <Marker position={markerPosition} icon={customIcon} />}
      </MapContainer>
    </div>
  );
};

export default GenericMap;