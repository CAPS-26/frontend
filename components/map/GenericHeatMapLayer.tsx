"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import dynamic from "next/dynamic";
import * as turf from "@turf/turf";
import RBush from "rbush"; //RBush untuk spatial index agar pencarian fitur di peta lebih cepat
import * as L from "leaflet";
import { interpolateAODColor, interpolatePM25Color } from "@/utils/color";
import { GeoJSONData, BoundaryGeoJSONData, BoundaryFeature } from "@/app/types";
import * as GeoJSONTypes from "geojson";
import GradientLegend from "../legend/GradientLegend";
import { debounce } from "lodash"; //lodash debounce untuk optimasi event mousemove

// Dynamic import untuk ImageOverlay Leaflet agar SSR-safe
const ImageOverlay = dynamic(() => import("react-leaflet").then((mod) => mod.ImageOverlay), { ssr: false });

import type { MapDataType } from "@/components/map/GenericMap";

interface HeatMapLayerProps {
  dataType: MapDataType;
  geoData: GeoJSONData | null;
  boundaryData: BoundaryGeoJSONData | null;
  selectedDate: string; // Tanggal data yang dipilih
  setSelectedDate: (date: string) => void; // Callback ubah tanggal
  isLoading: boolean;
  legendTitle: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  error?: string | null;
  fetchUrl: string;
  fetchByDateUrl: string;
  maxFutureDays?: number;
}

interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  featureIndex: number;
}

interface InterpolatedFeature {
  type: "Feature";
  geometry: GeoJSONTypes.Point;
  properties: { value: number };
}

const isPolygonOrMultiPolygon = (geometry: GeoJSONTypes.Geometry): geometry is GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon => {
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
};

const GenericHeatMapLayer: React.FC<HeatMapLayerProps> = ({ dataType, geoData, boundaryData, selectedDate, setSelectedDate, isLoading, legendTitle, inputRef, error, maxFutureDays = 14 }) => {
  const map = useMap();
  const staticLayerRef = useRef<L.ImageOverlay | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPosition = useRef<{ lat: number; lng: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const spatialIndexRef = useRef<RBush<RBushItem> | null>(null);
  const interpolatedDataRef = useRef<InterpolatedFeature[]>([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const handleTodayClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    if (inputRef.current) {
      inputRef.current.value = today;
    }
  };

  const clampDate = (dateStr: string): string => {
    if (minDateStr && dateStr < minDateStr) return minDateStr;
    if (dateStr > maxDateStr) return maxDateStr;
    return dateStr;
  };

  const handlePrevDate = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = clampDate(currentDate.toISOString().split("T")[0]);
    setSelectedDate(newDate);
    if (inputRef.current) inputRef.current.value = newDate;
  };

  const handleNextDate = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = clampDate(currentDate.toISOString().split("T")[0]);
    setSelectedDate(newDate);
    if (inputRef.current) inputRef.current.value = newDate;
  };

  const handleInfoClick = () => {
    setShowInfoPopup(true);
  };

  const handleClosePopup = () => {
    setShowInfoPopup(false);
  };

  const getInfoContent = () => {
    if (dataType === "aod") {
      return "Data AOD merupakan data yang digunakan untuk mengukur tingkat penyerapan atau penghamburan cahaya oleh partikel aerosol di atmosfer. Data ini bersumber dari satelit Himawari.";
    }
    if (dataType === "pm25-pred") {
      return "Prediksi PM2.5 menampilkan perkiraan konsentrasi partikel halus untuk wilayah Jakarta hingga level kelurahan. Nilai masa depan bersifat prediktif dan dapat berbeda dari pengukuran aktual di stasiun.";
    }
    return "Data PM2.5 (Estimasi) merupakan data yang didapatkan dari hasil pemodelan data AOD dengan sumber data dari satelit Himawari. Data ini memberikan estimasi kualitas PM2.5 pada area yang lebih luas, yaitu hingga level kelurahan.";
  };

  const getDataLabel = () => {
    if (dataType === "aod") return "AOD";
    if (dataType === "pm25-pred") return "PM2.5 (Prediksi)";
    return "PM2.5 (Estimasi)";
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (dataType === "pm25-pred" ? maxFutureDays : 0));
    return d.toISOString().split("T")[0];
  })();
  const minDateStr = dataType === "pm25-pred" ? todayStr : undefined;

  const cachedBoundaries = useMemo(() => {
    if (!geoData) {
      return turf.featureCollection([]);
    }
    const isPrediction = dataType === "pm25-pred";
    const validFeatures = geoData.features
      .filter((f: GeoJSONTypes.Feature<GeoJSONTypes.Point | GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, { aod_value?: number; pm25_value?: number }>) => {
        const value = dataType === "aod" ? f.properties.aod_value : f.properties.pm25_value;
        return value !== null && value !== undefined && !isNaN(value);
      })
      .map((feature: GeoJSONTypes.Feature<GeoJSONTypes.Point | GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, { aod_value?: number; pm25_value?: number }>) => {
        try {
          const bufferRadius = isPrediction ? 0.035 : 0.002;
          const buffered = turf.buffer(feature.geometry, bufferRadius, { units: "degrees" });
          if (buffered && isPolygonOrMultiPolygon(buffered.geometry)) {
            return buffered as GeoJSONTypes.Feature<GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon>;
          }
          return null;
        } catch (error) {
          return null;
        }
      })
      .filter((f): f is GeoJSONTypes.Feature<GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon> => f != null);
    return turf.featureCollection(validFeatures);
  }, [geoData, dataType]);

  useEffect(() => {
    if (!boundaryData || !boundaryData.features) {
      return;
    }
    const spatialIndex = new RBush<RBushItem>();
    boundaryData.features.forEach((feature: BoundaryFeature, index: number) => {
      try {
        const bbox = turf.bbox(feature.geometry);
        if (bbox.some((val) => isNaN(val))) {
          return;
        }
        spatialIndex.insert({
          minX: bbox[0],
          minY: bbox[1],
          maxX: bbox[2],
          maxY: bbox[3],
          featureIndex: index,
        });
      } catch (error) {
        return;
      }
    });
    spatialIndexRef.current = spatialIndex;

    return () => {
      spatialIndexRef.current = null;
    };
  }, [boundaryData]);

  const getTooltipContent = (value: number | null, kelurahanName: string): string => {
    const formattedValue = value !== null && value > 0 ? (dataType === "aod" ? value.toFixed(4) : value.toFixed(2)) : "No data";
    const color = value !== null && value > 0 ? (dataType === "aod" ? interpolateAODColor(value) : interpolatePM25Color(value)) : "rgba(160, 174, 192, 0.85)";
    const textColor = dataType === "aod" ? "#ffffff" : "#000000";
    const unit = dataType !== "aod" && formattedValue !== "No data" ? "µg/m³" : "";
    return `
      <div class="customTooltip">
        <div class="kelurahanName">${kelurahanName}</div>
        <div class="valueContainer">
          <div class="valueCircle" style="background-color: ${color}; color: ${textColor}">
            ${formattedValue}${unit ? ` ${unit}` : ""}
          </div>
        </div>
      </div>
    `;
  };

  const generateStaticGrid = useCallback(
    (geoData: GeoJSONData, boundaryData: BoundaryGeoJSONData) => {
      if (!boundaryData || !boundaryData.features) {
        return { imageUrl: null, bbox: [0, 0, 0, 0] };
      }

      const validBoundaryFeatures = boundaryData.features;
      if (validBoundaryFeatures.length === 0) {
        return { imageUrl: null, bbox: [0, 0, 0, 0] };
      }

      const points = geoData.features
        .map((feature: GeoJSONTypes.Feature<GeoJSONTypes.Point | GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, { aod_value?: number; pm25_value?: number }>) => {
          if (!feature.geometry) {
            return null;
          }
          let centroid: GeoJSONTypes.Feature<GeoJSONTypes.Point>;
          try {
            centroid = turf.centroid(feature.geometry);
          } catch {
            return null;
          }
          const value = dataType === "aod" ? feature.properties.aod_value : feature.properties.pm25_value;
          if (value == null || isNaN(value)) {
            return null;
          }
          return [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0], value];
        })
        .filter((p): p is [number, number, number] => p != null);

      const bbox = turf.bbox(turf.featureCollection(validBoundaryFeatures));
      const cellSize = 0.02;
      let grid;
      try {
        grid = turf.pointGrid(bbox, cellSize, { units: "degrees" });
      } catch (error) {
        return { imageUrl: null, bbox: [0, 0, 0, 0] };
      }

      let interpolated = turf.featureCollection([]);
      if (points.length > 0) {
        try {
          interpolated = turf.interpolate(turf.featureCollection(points.map((p) => 
            turf.point([p[1], p[0]], { value: p[2] }))), cellSize / 4, 
          { gridType: "point", property: "value", units: "degrees", weight: 2.5 });
        } catch (error) {
          return { imageUrl: null, bbox: [0, 0, 0, 0] };
        }
      }
      interpolatedDataRef.current = interpolated.features as InterpolatedFeature[];

      const canvas = document.createElement("canvas");
      const scale = 12; // Scale factor for higher resolution canvas
      const width = Math.ceil((bbox[2] - bbox[0]) / cellSize) * scale;
      const height = Math.ceil((bbox[3] - bbox[1]) / cellSize) * scale;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return { imageUrl: null, bbox: [0, 0, 0, 0] };
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, width, height);

      // Create boundary clipping mask to keep heatmap perfectly within Jakarta border
      try {
        ctx.save();
        ctx.beginPath();
        boundaryData.features.forEach((feature) => {
          if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates.forEach((ring) => {
              ring.forEach((coord, i) => {
                const cx = ((coord[0] - bbox[0]) / (bbox[2] - bbox[0])) * width;
                const cy = ((bbox[3] - coord[1]) / (bbox[3] - bbox[1])) * height;
                if (i === 0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx, cy);
              });
            });
          } else if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon.forEach((ring) => {
                ring.forEach((coord, i) => {
                  const cx = ((coord[0] - bbox[0]) / (bbox[2] - bbox[0])) * width;
                  const cy = ((bbox[3] - coord[1]) / (bbox[3] - bbox[1])) * height;
                  if (i === 0) ctx.moveTo(cx, cy);
                  else ctx.lineTo(cx, cy);
                });
              });
            });
          }
        });
        ctx.clip();
      } catch (e) {
        console.error("Error setting boundary clipping mask:", e);
      }

      // Enable blur for natural blending
      ctx.filter = `blur(${scale * 1.3}px)`;

      let validPoints = 0;
      grid.features.forEach((feature) => {
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || typeof coords[0] !== "number" || typeof coords[1] !== "number") {
          return;
        }

        const point = turf.point(coords as [number, number]);
        const inBuffer = cachedBoundaries.features.some((buffer) => {
          if (!isPolygonOrMultiPolygon(buffer.geometry)) {
            return false;
          }
          try {
            return turf.booleanPointInPolygon(point, buffer.geometry);
          } catch {
            return false;
          }
        });

        let value: number | null = null;
        if (inBuffer && interpolated.features.length > 0) {
          const closest = interpolated.features.reduce(
            (acc, f) => {
              if (f.geometry.type !== "Point" || !f.properties || f.properties.value == null) return acc;
              const dist = turf.distance(f.geometry as GeoJSONTypes.Point, coords as [number, number], { units: "degrees" });
              return dist < acc.dist ? { dist, value: f.properties.value } : acc;
            },
            { dist: Infinity, value: null as number | null }
          );
          value = closest.value !== null && closest.value > 0 ? closest.value : null;
        } else {
          const dataFeature = geoData.features.find((feature: GeoJSONTypes.Feature<GeoJSONTypes.Point | GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, { aod_value?: number; pm25_value?: number }>) => {
            if (!feature.geometry) {
              return false;
            }
            try {
              const centroid = turf.centroid(feature.geometry);
              const featurePoint = turf.point(centroid.geometry.coordinates);
              const distance = turf.distance(point, featurePoint, { units: "degrees" });
              return distance < 0.002;
            } catch {
              return false;
            }
          });

          if (dataFeature) {
            const rawValue = dataType === "aod" ? dataFeature.properties.aod_value : dataFeature.properties.pm25_value;
            value = rawValue !== undefined && rawValue !== null ? rawValue : null;
          }
        }

        if (value === null) return;

        const color = dataType === "aod" ? interpolateAODColor(value) : interpolatePM25Color(value);
        
        // Map to scaled canvas space
        const cx = ((coords[0] - bbox[0]) / (bbox[2] - bbox[0])) * width;
        const cy = ((bbox[3] - coords[1]) / (bbox[3] - bbox[1])) * height;
        
        ctx.fillStyle = color; 
        ctx.globalAlpha = 0.85;
        // Draw circles so they blend naturally under the blur filter and look round rather than boxy
        ctx.beginPath();
        ctx.arc(cx, cy, (scale * 1.35) / 2, 0, 2 * Math.PI);
        ctx.fill();
        validPoints++;
      });

      // Restore drawing state
      try {
        ctx.restore();
      } catch (e) {}

      const newImageUrl = validPoints > 0 ? canvas.toDataURL() : null;
      return { imageUrl: newImageUrl, bbox };
    },
    [dataType, cachedBoundaries]
  );

  const cachedGrid = useMemo(() => {
    if (!geoData || !boundaryData) {
      return { imageUrl: null, bbox: [0, 0, 0, 0] };
    }
    return generateStaticGrid(geoData, boundaryData);
  }, [geoData, boundaryData, generateStaticGrid]);

  const isPolygonOrMultiPolygonFeature = (
    feature: GeoJSONTypes.Feature<GeoJSONTypes.Point | GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, any>
  ): feature is GeoJSONTypes.Feature<GeoJSONTypes.Polygon | GeoJSONTypes.MultiPolygon, any> => {
    return isPolygonOrMultiPolygon(feature.geometry);
  };

  const handleMouseMove = useCallback(
    debounce((e: L.LeafletMouseEvent) => {
      if (!map || !boundaryData || !spatialIndexRef.current || error) {
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        return;
      }

      const point = turf.point([e.latlng.lng, e.latlng.lat]);
      const isInside = boundaryData.features.some((f: BoundaryFeature) => {
        try {
          return turf.booleanPointInPolygon(point, f.geometry);
        } catch {
          return false;
        }
      });

      if (!isInside) {
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        return;
      }

      const nearbyFeatures = spatialIndexRef.current.search({
        minX: e.latlng.lng,
        minY: e.latlng.lat,
        maxX: e.latlng.lng,
        maxY: e.latlng.lat,
      });

      const featureIndex = nearbyFeatures.find((item) => {
        const feature = boundaryData.features[item.featureIndex];
        try {
          return turf.booleanPointInPolygon(point, feature.geometry);
        } catch {
          return false;
        }
      })?.featureIndex;

      if (featureIndex === undefined) {
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        return;
      }

      const feature = boundaryData.features[featureIndex];
      const kelurahanName = feature.properties?.NAMOBJ || "Lokasi Tidak Dikenal";

      const validGeoDataFeatures = geoData?.features.filter(isPolygonOrMultiPolygonFeature) || [];

      const dataFeature = validGeoDataFeatures.find((f) => {
        try {
          return turf.booleanPointInPolygon(point, f.geometry);
        } catch {
          return false;
        }
      });

      let value: number | null = null;
      if (dataFeature) {
        value = dataType === "aod" ? dataFeature.properties.aod_value ?? null : dataFeature.properties.pm25_value ?? null;
      }

      if (value === null || value <= 0) {
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        return;
      }

      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }

      if (map) {
        tooltipRef.current = L.tooltip({
          sticky: true,
          direction: "top",
          offset: [0, -20],
          className: "customTooltip",
        })
          .setLatLng(e.latlng)
          .setContent(getTooltipContent(value, kelurahanName))
          .addTo(map);
      }
    }, 100),
    [map, boundaryData, geoData, dataType, error]
  );

  useEffect(() => {
    if (!map || !geoData || !boundaryData || isLoading || error) {
      if (staticLayerRef.current) {
        map.removeLayer(staticLayerRef.current);
        staticLayerRef.current = null;
      }
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      setImageUrl(null);
      setBounds(null);
      return;
    }

    const { imageUrl: newImageUrl, bbox } = cachedGrid;

    if (staticLayerRef.current) {
      map.removeLayer(staticLayerRef.current);
      staticLayerRef.current = null;
    }

    if (newImageUrl && Array.isArray(bbox) && bbox.length === 4 && bbox.every((val) => typeof val === "number" && !isNaN(val))) {
      const newBounds: L.LatLngBoundsExpression = [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ];
      staticLayerRef.current = L.imageOverlay(newImageUrl, newBounds, { opacity: 0.85, interactive: true, zIndex: 1000 }).addTo(map);

      map.on("mousemove", handleMouseMove);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        map.off("mousemove", handleMouseMove);
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        if (staticLayerRef.current) {
          map.removeLayer(staticLayerRef.current);
          staticLayerRef.current = null;
        }
        setImageUrl(null);
        setBounds(null);
      };
    } else {
      setImageUrl(null);
      setBounds(null);
    }
  }, [map, cachedGrid, geoData, boundaryData, isLoading, dataType, handleMouseMove, error]);

  return (
    <>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100">
          <div className="w-6 h-6 rounded-full border-2 border-primary-blue/30 border-t-primary-blue animate-spin" />
          <span className="text-sm font-semibold text-gray-700">Memuat Heatmap...</span>
        </div>
      )}
      
      {/* Controls Container */}
      <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2.5 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100">
        <label htmlFor="datePicker" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Pilih Tanggal
        </label>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-250 hover:text-gray-900 focus:outline-none transition-all" onClick={handlePrevDate} title="Tanggal Sebelumnya">
            &lt;
          </button>
          <input
            type="date"
            id="datePicker"
            value={selectedDate}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => setSelectedDate(clampDate(e.target.value))}
            className="px-3 py-1.5 w-[140px] text-sm font-semibold text-gray-750 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
            ref={inputRef}
          />
          <button className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-250 hover:text-gray-900 focus:outline-none transition-all" onClick={handleNextDate} title="Tanggal Berikutnya">
            &gt;
          </button>
        </div>
        <button className="w-full py-2 text-xs font-bold bg-primary-blue hover:bg-primary-dark text-white rounded-xl shadow-md shadow-blue-500/15 transition-all focus:outline-none" onClick={handleTodayClick}>
          Hari Ini
        </button>
      </div>

      {/* Info Button */}
      <div 
        className={`absolute ${dataType === "aod" ? "bottom-[8.5rem]" : "bottom-[15rem]"} left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-150 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all duration-200`} 
        onClick={handleInfoClick}
      >
        <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold text-gray-700">Informasi Data {getDataLabel()}</span>
      </div>
      
      {showInfoPopup && (
        <div className={`absolute ${dataType === "aod" ? "bottom-[12rem]" : "bottom-[18.5rem]"} left-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xl z-[1100] max-w-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          <div className="flex justify-between items-center pb-1 border-b border-gray-50">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Data {getDataLabel()}</h4>
            <button className="text-gray-400 hover:text-gray-600 font-extrabold text-sm" onClick={handleClosePopup}>
              ×
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{getInfoContent()}</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">{legendTitle}</h4>
        <GradientLegend dataType={dataType} />
      </div>

      {imageUrl && bounds && <ImageOverlay url={imageUrl} bounds={bounds} opacity={0.85} interactive={true} zIndex={1000} />}
    </>
  );
};

export default GenericHeatMapLayer;
