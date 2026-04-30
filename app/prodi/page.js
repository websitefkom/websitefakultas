"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function Prodi() {
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdi = async () => {
      try {
        const res = await fetch("/api/akademik/prodi"); // ✅ sesuai API kamu
        if (!res.ok) throw new Error("Gagal fetch data prodi");
        const data = await res.json();
        setProdiList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProdi();
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
          alt="Program Studi Background"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />
        <div className="relative z-10 text-center w-full px-4">
          <h1 className="text-4xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Program Studi
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mb-4" />
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Pilih program studi yang sesuai dengan minat dan cita-cita Anda di
            Fakultas Komputer Ma&apos;soem University.
          </p>
        </div>
      </section>

      {/* Prodi Section */}
      <section
        className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-100 relative"
      >
        <div className="container mx-auto px-4 space-y-16">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-pulse text-blue-600 text-lg font-semibold">
                Memuat dokumen...
              </div>
            </div>
          ) : prodiList.length > 0 ? (
            prodiList.map((item, idx) => (
              <div
                key={item._id}
                className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
              >
                {/* Gambar Prodi */}
                <div className="relative w-full md:w-1/2 md:max-w-md h-64 md:h-80 rounded-xl overflow-hidden shadow-md mx-auto">
                  <Image
                    src={item.gambar || "/default-prodi.jpg"}
                    alt={item.nama || "Program Studi"}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Deskripsi Prodi */}
                <div className="w-full md:w-1/2 bg-white/90 rounded-xl shadow-lg p-6 md:p-8 flex flex-col justify-center h-full">
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-4 text-center md:text-left">
                    {item.nama}
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 text-justify md:text-left">
                    {item.deskripsi}
                  </p>
                  <div className="flex justify-center md:justify-start">
                    <a
                      href={`/prodi/${item._id}`}
                      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Lihat Detail
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-600 py-20">
              Belum ada data program studi.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
