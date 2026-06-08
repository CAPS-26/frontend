"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../styles/navbar.module.css";

const Navbar = () => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeAll = () => {
    setIsDropdownOpen(false);
    setIsMobileOpen(false);
  };

  const getTitle = (path: string) => {
    switch (path) {
      case "/":
        return "AOD";
      case "/pm25-estimasi":
        return "PM2.5 (Estimasi)";
      case "/pm25-prediksi":
        return "PM2.5 (Prediksi)";
      case "/pm25-aktual":
        return "PM2.5 (Aktual)";
      case "/calendar":
        return "Kalender";
      case "/about":
        return "Tentang";
      default:
        return "WebGIS PM2.5";
    }
  };

  const mapLinks = [
    { href: "/", label: "AOD" },
    { href: "/pm25-estimasi", label: "PM2.5 (Estimasi)" },
    { href: "/pm25-prediksi", label: "PM2.5 (Prediksi)" },
    { href: "/pm25-aktual", label: "PM2.5 (Aktual)" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>{getTitle(pathname)}</div>

      <button
        type="button"
        className={styles.mobileToggle}
        aria-label="Menu"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((v) => !v)}
      >
        {isMobileOpen ? "✕" : "☰"}
      </button>

      <div className={`${styles.center} ${isMobileOpen ? styles.centerOpen : ""}`}>
        <div className={styles.dropdown}>
          <button type="button" onClick={() => setIsDropdownOpen((v) => !v)} className={styles.navLink}>
            PETA ▾
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              {mapLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.dropdownItem} ${pathname === link.href ? styles.active : ""}`}
                  onClick={closeAll}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/calendar" className={`${styles.navLink} ${pathname === "/calendar" ? styles.active : ""}`} onClick={closeAll}>
          Kalender
        </Link>
        <Link href="/about" className={`${styles.navLink} ${pathname === "/about" ? styles.active : ""}`} onClick={closeAll}>
          Tentang
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;


