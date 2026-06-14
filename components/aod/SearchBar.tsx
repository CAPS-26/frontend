"use client";

import React, { useRef, useState, useEffect } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import * as L from "leaflet";
import { BoundaryGeoJSONData } from "@/app/types";
import * as turf from "@turf/turf";

interface GeoSearchResult {
  x: number; // long
  y: number; // lat
  label: string;
  bounds: [number, number][] | null;
}

interface SearchResult {
  x: number; // long
  y: number; // lat
  label: string;
  bounds: L.LatLngBounds | null;
}

interface SearchBarProps {
  // fungsi callback untuk memperbarui posisi marker di peta sesuai lokasi hasil pencarian
  updateMarker: (latlng: L.LatLng) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
  // validasi apakah lokasi masuk wilayah Jakarta
  boundaryData: BoundaryGeoJSONData | null;
  // fungsi callback untuk mereset kondisi peta (menghapus marker dan mengembalikan view awal)
  resetMap: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ updateMarker, mapRef, boundaryData, resetMap }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  //menyimpan timer debounce agar fungsi cari tidak dijalankan terlalu sering saat user mengetik
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  // nilai input teks pencarian
  const [searchQuery, setSearchQuery] = useState<string>("");
  // array hasil pencarian yang sudah difilter dan akan ditampilkan di dropdown
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Membersihkan timer debounce saat komponen hilang agar pencarian yang tertunda tidak tetap jalan
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  // Ini kode yang berjalan sekali ketika komponen SearchBar muncul di layar (mount)
  // hilangin dropdown pencarian ketika user klik di tempat lain
  useEffect(() => {
    if (typeof window === "undefined") return;

    const input = inputRef.current;
    if (input) {
      const handleBlur = () => {
        setTimeout(() => setSearchResults([]), 200);
      };
      input.addEventListener("blur", handleBlur);
      return () => {
        input.removeEventListener("blur", handleBlur);
      };
    }
  }, []);

  // memeriksa apakah titik (latitude, longitude) berada dalam polygon batas wilayah Jakarta (boundaryData),
  // jika lokasi valid maka ditampilkan jika lokasi tidak valid maka diabaikan
  const isPointInJakarta = (lat: number, lng: number): boolean => {
    if (!boundaryData || !boundaryData.features) return false;
    const point = turf.point([lng, lat]);
    return boundaryData.features.some((feature) => {
      try {
        return turf.booleanPointInPolygon(point, feature.geometry);
      } catch {
        return false;
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value; // Ambil teks yang baru diketik user
    setSearchQuery(query); // Update state untuk input teks pencarian
    setError(null); // Reset error saat user mulai mengetik baru

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current); // bersihkan timer debounce jika masih jalan

    if (query.length > 2 && typeof window !== "undefined") {
      // Cek apakah input lebih dari 2 karakter & kode berjalan di browser (bukan server)
      debounceTimeout.current = setTimeout(async () => {
        // Mulai timer delay 500ms sebelum pencarian dieksekusi
        try {
          const provider = new OpenStreetMapProvider();
          // Pencarian dilakukan menggunakan library leaflet-geosearch dengan provider OpenStreetMap, menambahkan "Jakarta, Indonesia" pada query supaya pencarian terfokus di wilayah Jakarta
          const results: GeoSearchResult[] = await provider.search({ query: `${query}, Jakarta, Indonesia` });
          // jika hasil pencarian kosong, beri pesan error
          if (results.length === 0) {
            setError("Tidak ada hasil yang ditemukan di Jakarta");
            setSearchResults([]);
            return;
          }
          const formattedResults: SearchResult[] = results
            // Filter hasil hanya yang benar-benar ada di dalam wilayah Jakarta menggunakan fungsi isPointInJakarta
            .filter((result) => isPointInJakarta(result.y, result.x))
            // Batasi maksimal 5 hasil dan format hasil agar mudah dipakai
            .slice(0, 5)
            // Hasil akhir disiapkan dalam bentuk array formattedResults (dropdown)
            .map((result: GeoSearchResult) => ({
              x: result.x,
              y: result.y,
              label: result.label,
              bounds: result.bounds
                ? L.latLngBounds([
                    [result.bounds[0][0], result.bounds[0][1]],
                    [result.bounds[1][0], result.bounds[1][1]],
                  ])
                : null,
            }));
          // jika setelah filter ternyata tidak ada lokasi yang benar-benar di Jakarta, tampilkan error dan kosongkan dropdown
          if (formattedResults.length === 0) {
            setError("Tidak ada hasil yang ditemukan di wilayah Jakarta");
            setSearchResults([]);
            return;
          }
          setSearchResults(formattedResults);
          // Kalau ada hasil valid, simpan ke state searchResults agar UI bisa menampilkan daftar dropdown lokasi pencarian.
        } catch (error) {
          console.error("Search error:", error);
          setError("Gagal melakukan pencarian");
          setSearchResults([]);
        }
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  // Menangani Pemilihan Hasil Pencarian
  // Saat user klik atau pilih hasil pencarian,
  const handleSearchSelect = (result: SearchResult) => {
    //  input diisi label lokasi tersebut
    setSearchQuery(result.label);
    // dropdown hasil diclosed
    setSearchResults([]);
    // dan kesalahan error direset
    setError(null);
    if (mapRef.current) {
      const latlng = L.latLng(result.y, result.x);
      updateMarker(latlng); // letakkan marker ke koordinat hasil pencarian
      mapRef.current.setView([result.y, result.x], 15); // fokus peta ke lokasi tersebut dengan zoom 15
    }
  };

  // Reset Pencarian dan Marker
  const handleReset = () => {
    // Mengosongkan input, hasil pencarian, dan pesan error
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    resetMap(); // Memanggil fungsi resetMap yang menghapus marker dan mengatur view peta ke default
  };

  // Render UI Komponen SearchBar
  return (
    <div className="flex flex-col gap-2.5 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 w-72 mt-[160px] relative">
      <label htmlFor="searchInput" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Cari Lokasi
      </label>
      <div className="flex items-center gap-2 text-black">
        {/* input text dengan event onChange memicu handleSearchChange. */}
        <input
          type="text"
          id="searchInput"
          placeholder="Cari lokasi di Jakarta..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="px-3 py-2 w-full text-sm font-semibold text-gray-750 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
          ref={inputRef}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (searchResults.length > 0 && e.key === "Enter") {
              e.preventDefault();
              handleSearchSelect(searchResults[0]);
            }
          }}
        />
        <button
          className="px-4 py-2 text-xs font-bold bg-primary-blue hover:bg-primary-dark text-white rounded-lg transition-colors focus:outline-none"
          onClick={() => {
            if (searchQuery && typeof window !== "undefined") {
              const provider = new OpenStreetMapProvider();
              provider
                .search({ query: `${searchQuery}, Jakarta, Indonesia` })
                .then((results: GeoSearchResult[]) => {
                  const validResults = results.filter((result) => isPointInJakarta(result.y, result.x));
                  if (validResults.length > 0) {
                    const formattedResult: SearchResult = {
                      x: validResults[0].x,
                      y: validResults[0].y,
                      label: validResults[0].label,
                      bounds: validResults[0].bounds
                        ? L.latLngBounds([
                            [validResults[0].bounds[0][0], validResults[0].bounds[0][1]],
                            [validResults[0].bounds[1][0], validResults[0].bounds[1][1]],
                          ])
                        : null,
                    };
                    handleSearchSelect(formattedResult);
                  } else {
                    setError("Lokasi tidak ada di wilayah Jakarta");
                  }
                })
                .catch((err) => {
                  console.error("Search error:", err);
                  setError("Gagal melakukan pencarian");
                });
            }
          }}
        >
          Cari
        </button>
      </div>
      <button 
        className="w-full py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors focus:outline-none" 
        onClick={handleReset}
      >
        Reset
      </button>
      
      {error && (
        <div className="absolute top-[100%] left-0 w-full bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl mt-2 text-xs font-semibold shadow-md z-[1100]">
          {error}
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto z-[1100] py-1">
          {searchResults.map((result, index) => (
            <div 
              key={index} 
              className="px-4 py-2.5 text-xs text-gray-700 hover:bg-slate-50 cursor-pointer transition-colors" 
              onClick={() => handleSearchSelect(result)}
            >
              {result.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// React.memo membungkus komponen agar tidak re-render jika props dan state tidak berubah, meningkatkan performa
SearchBar.displayName = "SearchBar";

export default React.memo(SearchBar);
