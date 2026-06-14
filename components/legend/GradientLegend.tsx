import React from "react";

interface GradientLegendProps {
  dataType: "aod" | "pm25-est" | "pm25-pred";
}

const GradientLegend: React.FC<GradientLegendProps> = ({ dataType }) => {
  const aodColors = [
    "rgba(128, 0, 128, 0.85)", // Ungu (<0)
    "rgba(0, 0, 255, 0.85)", // Biru
    "rgba(0, 128, 0, 0.85)", // Hijau
    "rgba(255, 255, 0, 0.85)", // Kuning
    "rgba(255, 165, 0, 0.85)", // Jingga
    "rgba(255, 0, 0, 0.85)", // Merah (>4)
  ];

  const pm25Colors = [
    "rgba(0, 204, 0, 0.85)", // Hijau (0-15.4)
    "rgba(1, 51, 255, 0.85)", // Biru (15.5-55.4)
    "rgba(255, 201, 0, 0.85)", // Kuning (55.5-150.4)
    "rgba(255, 0, 0, 0.85)", // Merah (150.5-250.4)
    "rgba(34, 34, 34, 0.85)", // Hitam (>250.4)
  ];

  const gradient = dataType === "aod" ? `linear-gradient(to right, ${aodColors.join(", ")})` : `linear-gradient(to right, ${pm25Colors.join(", ")})`;

  return (
    <div className="mt-2 text-gray-700">
      <div className="h-3 w-56 rounded-full" style={{ background: gradient }} />
      <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
        {dataType === "aod" ? (
          <>
            <span>0 (Rendah)</span>
            <span>4.0 (Tinggi)</span>
          </>
        ) : (
          <>
            <span>0</span>
            <span>300+</span>
          </>
        )}
      </div>
      <div className="mt-3.5 space-y-1.5">
        {dataType === "aod" ? (
          <></>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: "#00CC00" }} />
              <span>Baik (0 - 15.4)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: "#0133FF" }} />
              <span>Sedang (15.5 - 55.4)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: "#FFC900" }} />
              <span>Tidak Sehat (55.5 - 150.4)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: "#FF0000" }} />
              <span>Sangat Tidak Sehat (150.5 - 250.4)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: "#222222" }} />
              <span>Berbahaya (&gt;250.4)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GradientLegend;
