"use client";
import Navbar from "@/components/navbar/Navbar";
import React from "react";

const About = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Tentang WebGIS PM2.5 dan AOD
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Platform visualisasi interaktif kualitas udara Jakarta.
            </p>
          </div>

          {/* Capstone 26 Intro Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
              Capstone 26
            </h2>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              <strong>Sistem PM2.5 & Aerosol Optical Depth (AOD)</strong> adalah platform <strong>WebGIS terintegrasi</strong> yang didukung oleh model <strong>Deep Learning (LSTM)</strong> dan <strong>analisis Spasial (Clustering)</strong>. Sistem ini dirancang untuk memantau, memetakan, dan memprediksi konsentrasi polusi udara (PM2.5) di Jakarta dengan menggabungkan data citra satelit Himawari (AOD) dan sensor stasiun cuaca darat secara <em>real-time</em>.
            </p>
          </section>

          {/* Greetings & Team Table Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
              Greetings from us
            </h2>
            <p className="text-gray-700 text-base mb-6">
              Halo semuanya! Kami dari kelompok <strong>Capstone 26</strong>, terdiri dari empat mahasiswa yang masing-masing memiliki peran khusus dalam project ini, yaitu:
            </p>
            
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Peran</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fokus Area</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">NIM</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Backend & Data Engineer</td>
                    <td className="px-6 py-4">Raihan Putra Kirana</td>
                    <td className="px-6 py-4">Data & REST API Management</td>
                    <td className="px-6 py-4 font-mono">G6401231027</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Machine Learning Engineer</td>
                    <td className="px-6 py-4">Aulia Rahmasyifa Az Zahra</td>
                    <td className="px-6 py-4">Time-Series Forecasting (LSTM)</td>
                    <td className="px-6 py-4 font-mono">G6401231033</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Spatial Data Specialist</td>
                    <td className="px-6 py-4">Qois Firosi</td>
                    <td className="px-6 py-4">Spatio-Temporal Clustering</td>
                    <td className="px-6 py-4 font-mono">G6401231031</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Frontend & UI/UX</td>
                    <td className="px-6 py-4">Tiska Walida Nafisa</td>
                    <td className="px-6 py-4">WebGIS & UI/UX Visualization</td>
                    <td className="px-6 py-4 font-mono">G6401231008</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Features Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">Fitur Website</h2>
            <p className="text-gray-700 text-base mb-6">WebGIS ini dirancang untuk memvisualisasikan dan menganalisis data kualitas udara di Jakarta dengan fitur-fitur berikut:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Heatmap Interaktif",
                  desc: (
                    <>
                      Menampilkan data kualitas udara (AOD dan PM2.5) hingga level kelurahan dalam <i>heatmap</i>, dengan <i>popup</i> yang menunjukkan nilai dan nama kelurahan saat kursor diarahkan ke peta.
                    </>
                  ),
                },
                {
                  title: "Pencarian Lokasi",
                  desc: (
                    <>
                      Memungkinkan pencarian lokasi spesifik pada <i>heatmap</i> AOD dan PM2.5 (estimasi), terbatas hanya untuk wilayah Jakarta.
                    </>
                  ),
                },
                {
                  title: "Data Historis",
                  desc: (
                    <>
                      Pilihan tanggal disediakan melalui kalender untuk melihat <i>heatmap</i> AOD dan PM2.5 (estimasi), atau akses data PM2.5 (aktual) dan cuaca melalui <i>splitscreen</i> kalender berdasarkan stasiun dan tanggal.
                    </>
                  ),
                },
                {
                  title: "Kalender",
                  desc: "Menyajikan data historis PM2.5 (aktual) dengan rekomendasi aktivitas berdasarkan nilai PM2.5 dan penjelasan indikator (Baik, Sedang, Tidak Sehat, Sangat Tidak Sehat, Berbahaya) dan data cuaca berdasarkan stasiun.",
                },
              ].map((feature, index) => (
                <li key={index} className="bg-blue-50/50 p-5 rounded-xl border border-blue-100/50 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Sources Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">Data Yang Digunakan</h2>
            <ul className="list-disc pl-6 space-y-6">
              {[
                {
                  title: (
                    <>
                      AOD (<i>Aerosol Optical Depth</i>)
                    </>
                  ),
                  desc: (
                    <>
                      Data AOD merupakan data yang digunakan untuk mengukur tingkat penyerapan atau penghamburan cahaya oleh partikel aerosol di atmosfer. Data ini bersumber dari satelit Himawari yang didapatkan dari{" "}
                      <a href="http://ftp.ptree.jaxa.jp/" target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline font-semibold">
                        http://ftp.ptree.jaxa.jp/
                      </a>
                      .
                    </>
                  ),
                },
                {
                  title: "PM2.5 (Estimasi)",
                  desc: "Data PM2.5 (Estimasi) merupakan data yang didapatkan dari hasil pemodelan data AOD dengan sumber data dari satelit Himawari. Data ini memberikan estimasi kualitas PM2.5 pada area yang lebih luas, yaitu hingga level kelurahan.",
                },
                {
                  title: <>PM2.5 (Aktual)</>,
                  desc: (
                    <>
                      Data PM2.5 (Aktual) merupakan data ISPU PM2.5 yang didapatkan dari{" "}
                      <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline font-semibold">
                        OpenMeteo Air Quality API
                      </a>{" "}
                      dengan fallback dari{" "}
                      <a href="https://aqicn.org" target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline font-semibold">
                        AQICN (aqicn.org)
                      </a>
                      . Terdapat 8 stasiun pemantauan di Jakarta, yaitu stasiun US Embassy 1, US Embassy 2, Bundaran HI, Kelapa Gading, Jagakarsa, Jakarta GBK, Lubang Buaya, dan Kebun Jeruk yang menampilkan konsentrasi PM2.5 aktual. Data ini memiliki akurasi yang tinggi namun terbatas pada lokasi stasiun.
                    </>
                  ),
                },
                {
                  title: "Data Cuaca",
                  desc: (
                    <>
                      Data cuaca digunakan untuk melakukan pemantauan cuaca dengan parameter suhu, curah hujan, kelembaban, arah angin, dan kecepatan angin. Data diperoleh dari{" "}
                      <a href="https://www.visualcrossing.com" target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline font-semibold">
                        Visual Crossing
                      </a>
                      .
                    </>
                  ),
                },
              ].map((data, index) => (
                <li key={index} className="text-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 inline-block mb-1">{data.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{data.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};

export default About;
