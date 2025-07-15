"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../styles/navbar.module.css";

const Navbar = () => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const getTitle = (path: string) => {
    switch (path) {
      case "/":
        return "AOD";
      case "/pm25-estimasi":
        return "PM2.5 (Estimasi)";
      case "/pm25-aktual":
        return "PM2.5 (Aktual)";
      case "/calendar":
        return "Kalender";
      case "/about":
        return "Tentang";
      default:
        return "WebGIS PM2.5 dan AOD";
    }
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.left}>{getTitle(pathname)}</div>

      <div className={styles.center}>
        <div className={styles.dropdown}>
          <button onClick={toggleDropdown} className={styles.navLink}>
            PETA ▾
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link href="/" className={`${styles.dropdownItem} ${pathname === "/" ? styles.active : ""}`} onClick={closeDropdown}>
                AOD
              </Link>
              <Link href="/pm25-estimasi" className={`${styles.dropdownItem} ${pathname === "/pm25-estimasi" ? styles.active : ""}`} onClick={closeDropdown}>
                PM2.5 (Estimasi)
              </Link>
              <Link href="/pm25-aktual" className={`${styles.dropdownItem} ${pathname === "/pm25-aktual" ? styles.active : ""}`} onClick={closeDropdown}>
                PM2.5 (Aktual)
              </Link>
            </div>
          )}
        </div>

        <Link href="/calendar" className={`${styles.navLink} ${pathname === "/calendar" ? styles.active : ""}`}>
          Kalender
        </Link>
        <Link href="/about" className={`${styles.navLink} ${pathname === "/about" ? styles.active : ""}`}>
          Tentang
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
