import React from "react";
import styles from "@/styles/heatmap.module.css";

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
    <div className={styles.gradientLegend}>
      <div className={styles.gradientBar} style={{ background: gradient }} />
      <div className={styles.gradientLabels}>
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
      <div className={styles.legendLabels}>
        {dataType === "aod" ? (
          <></>
        ) : (
          <>
            <div className={styles.legendItem}>
              <span>Baik (0 - 15.4)</span>
            </div>
            <div className={styles.legendItem}>
              <span>Sedang (15.5 - 55.4)</span>
            </div>
            <div className={styles.legendItem}>
              <span>Tidak Sehat (55.5 - 150.4)</span>
            </div>
            <div className={styles.legendItem}>
              <span>Sangat Tidak Sehat (150.5 - 250.4)</span>
            </div>
            <div className={styles.legendItem}>
              <span>Berbahaya (&gt;250.4)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GradientLegend;
