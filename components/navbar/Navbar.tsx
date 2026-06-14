"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        return "AOD (Himawari)";
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
    { href: "/", label: "AOD (Himawari)" },
    { href: "/pm25-estimasi", label: "PM2.5 (Estimasi)" },
    { href: "/pm25-prediksi", label: "PM2.5 (Prediksi)" },
    { href: "/pm25-aktual", label: "PM2.5 (Aktual)" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-[1100] shadow-sm transition-all duration-300">
      {/* Logo / Brand Name */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2" onClick={closeAll}>
          <div className="w-8 h-8 rounded-lg bg-blue-gradient flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            P
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-blue-gradient">
            PM2.5 & AOD
          </span>
        </Link>
        <span className="hidden sm:inline-block h-5 w-[1px] bg-gray-200" />
        <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
          {getTitle(pathname)}
        </span>
      </div>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8 font-medium">
        {/* Dropdown for Map Options */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((v) => !v)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className={`flex items-center gap-1.5 py-2 text-sm transition-colors duration-200 font-semibold focus:outline-none ${
              mapLinks.some((l) => l.href === pathname)
                ? "text-primary-blue font-bold border-b-2 border-primary-blue"
                : "text-gray-600 hover:text-primary-blue"
            }`}
          >
            Visualisasi Peta
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-12 left-0 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[1200]">
              {mapLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-primary-blue font-semibold border-l-4 border-primary-blue"
                        : "text-gray-600 hover:bg-gray-50 hover:text-primary-blue"
                    }`}
                    onClick={closeAll}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href="/calendar"
          className={`py-2 text-sm transition-colors duration-200 font-semibold ${
            pathname === "/calendar"
              ? "text-primary-blue font-bold border-b-2 border-primary-blue"
              : "text-gray-600 hover:text-primary-blue"
          }`}
          onClick={closeAll}
        >
          Kalender PM2.5
        </Link>
        <Link
          href="/about"
          className={`py-2 text-sm transition-colors duration-200 font-semibold ${
            pathname === "/about"
              ? "text-primary-blue font-bold border-b-2 border-primary-blue"
              : "text-gray-600 hover:text-primary-blue"
          }`}
          onClick={closeAll}
        >
          Tentang & Credits
        </Link>
      </div>

      {/* Mobile Toggle Button */}
      <button
        type="button"
        className="md:hidden flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors focus:outline-none"
        aria-label="Menu"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((v) => !v)}
      >
        {isMobileOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Panel */}
      {isMobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg p-5 flex flex-col gap-4 md:hidden z-[1101]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Visualisasi Peta</div>
          <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-gray-100">
            {mapLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 text-sm rounded-lg px-2 transition-all ${
                    isActive
                      ? "bg-blue-50 text-primary-blue font-semibold"
                      : "text-gray-600 hover:text-primary-blue"
                  }`}
                  onClick={closeAll}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="h-[1px] bg-gray-100 my-1" />

          <Link
            href="/calendar"
            className={`py-2.5 text-sm rounded-lg pl-2 transition-all ${
              pathname === "/calendar"
                ? "bg-blue-50 text-primary-blue font-bold border-l-4 border-primary-blue"
                : "text-gray-600 hover:text-primary-blue"
            }`}
            onClick={closeAll}
          >
            Kalender PM2.5
          </Link>
          <Link
            href="/about"
            className={`py-2.5 text-sm rounded-lg pl-2 transition-all ${
              pathname === "/about"
                ? "bg-blue-50 text-primary-blue font-bold border-l-4 border-primary-blue"
                : "text-gray-600 hover:text-primary-blue"
            }`}
            onClick={closeAll}
          >
            Tentang & Credits
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


