import * as GeoJSON from "geojson";

// dipakai untuk heatmap di GenericHeatMapLayer.tsx
export interface Feature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: {
    aod_value: number | null;
    pm25_value: number | null;
  } & Record<string, unknown>;
}

// digunakan untuk batas wilayah di GenericHeatMapLayer.tsx dan SearchBar.tsx
export interface BoundaryFeature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: {
    NAMOBJ: string;
  } & Record<string, unknown>;
}

//digunakan untuk state geoData di GenericMap.tsx dan GenericHeatMapLayer.tsx
export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSON.Feature<GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon, { aod_value?: number; pm25_value?: number }>[];
}

//digunakan untuk state boundaryData di peta dan heatmap
export interface BoundaryGeoJSONData {
  type: "FeatureCollection";
  features: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { NAMOBJ: string } & Record<string, unknown>>[];
}

//digunakan untuk fetch, parsing data API PM2.5 dan menampilkan pada peta dan tabel di Calendar.tsx
export interface PM25Data {
  id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  date: string;
  pm25_value: number | null;
  station: number;
}

// digunakan untuk data cuaca
export interface WeatherData {
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

//digunakan di Stasiun.tsx dan stasiunPM25 komponen untuk rendering marker dan popup.
export interface StationData {
  station_name: string;
  latitude: number;
  longitude: number;
  pm25_value: number | null;
}

// tipe lanjutan untuk properties lengkap yang beragam sebagai tipe tambahan untuk pemakaian properti fitur GeoJSON
export interface FeatureProperties {
  name: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  pm25_value?: number;
  aod_value?: number;
  color?: string;
  updated: string;
  kecamatan?: string;
  kota?: string;
  NAMOBJ?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface BoundaryProperties {
  NAMOBJ: string;
  [key: string]: string | number | boolean | null | undefined;
}
