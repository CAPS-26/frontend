"use client";
import Navbar from "@/components/navbar/Navbar";
import React from "react";

const About = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#EEF5EB] py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-black mb-12">Tentang WebGIS PM2.5 dan AOD</h1>

          <section className="mb-12 bg-white rounded-xl p-8 border border-green-200 hover:shadow-lg hover:border-green-300 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">Fitur Website</h2>
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">WebGIS ini dirancang untuk memvisualisasikan dan menganalisis data kualitas udara di Jakarta dengan fitur-fitur berikut:</p>
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
                <li key={index} className="bg-green-50 p-4 rounded-lg border border-transparent hover:border-green-200 hover:shadow-md hover:shadow-green-100 transition-all duration-200">
                  <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 border border-green-200 hover:shadow-lg hover:border-green-300 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">Data Yang Digunakan</h2>
            {/* <p className="text-gray-700 text-lg mb-6 leading-relaxed">Website ini menggunakan empat jenis data:</p> */}
            <ul className="list-disc pl-6 space-y-4">
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
                      <a href="http://ftp.ptree.jaxa.jp/" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline hover:text-teal-600">
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
                      <a href="https://rendahemisi.jakarta.go.id" target="_blank" rel="noopener noreferrer" 
                      className="text-teal-500 hover:underline hover:text-teal-600">
                        {" "}
                        Jakarta Rendah Emisi.{" "}
                      </a>
                      Terdapat 8 Stasiun Pemantauan Kualitas Udara (SPKU) di Jakarta, yaitu stasiun US Embassy 1, 
                      US Embassy 2, Bundaran HI, Kelapa Gading, Jagakarsa, Jakarta GBK, Lubang Buaya, dan Kebun J
                      Seruk yang menampilkan konsentrasi
                      PM2.5 aktual. Data ini memiliki akurasi yang tinggi namun terbatas pada lokasi stasiun.
                    </>
                  ),
                },
                {
                  title: "Data Cuaca",
                  desc: (
                    <>
                      Data cuaca digunakan untuk melakukan pemantauan cuaca. Data diperoleh dari{" "}
                      <a href="https://www.visualcrossing.com" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline hover:text-teal-600">
                        Visual Crossing
                      </a>
                      .
                    </>
                  ),
                },
              ].map((data, index) => (
                <li key={index} className="text-gray-600">
                  <h3 className="text-lg font-semibold text-black">{data.title}</h3>
                  <p>{data.desc}</p>
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
