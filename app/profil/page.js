"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiUsers, FiUserPlus, FiCalendar } from "react-icons/fi";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function Profil() {
  const [profil, setProfil] = useState({
    visi: "",
    misi: [],
    tujuan: [],
  });

  useEffect(() => {
    fetch("/api/profil")
      .then((res) => res.json())
      .then((data) => {
        setProfil({
          visi: data.visi || "",
          misi: Array.isArray(data.misi) ? data.misi : [],
          tujuan: Array.isArray(data.tujuan) ? data.tujuan : [],
        });
      });
  }, []);

  const year = new Date().getFullYear();
  const currentAcademicYear = `${year}/${year + 1}`;

  return (
    <>
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center">
        {/* Background */}
        <Image
          src="/background/bersama.jpg"
          alt="Campus Background"
          fill
          priority
          className="object-cover brightness-50"
        />
        {/* Overlay gradasi */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />

        {/* Konten */}
        <div className="relative z-10 max-w-3xl px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-wide drop-shadow-lg"
          >
            Tentang Kami
          </motion.h1>

          <div className="w-20 h-[3px] bg-gradient-to-r from-blue-400 to-blue-200 rounded-full mx-auto my-6" />

          <p className="text-gray-200 text-base md:text-1x1 leading-relaxed">
            Fakultas Komputer
          </p>
          <p className="text-gray-200 text-base md:text-1x1 leading-relaxed">
            Universitas Ma&#39;soem
          </p>
        </div>
      </section>


      <section className="py-20 bg-white text-center px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Fakultas Komputer Universitas Ma&#39;soem merupakan pusat pengembangan pendidikan di bidang teknologi informasi
            dan bisnis digital yang berorientasi pada inovasi, profesionalisme, dan etika. Fakultas ini menaungi tiga
            program studi unggulan, yaitu <span className="font-semibold text-blue-700">Sistem Informasi </span>
            yang berfokus pada analisis data dan pengelolaan sistem bisnis berbasis teknologi,
            <span className="font-semibold text-blue-700"> Bisnis Digital </span> yang menekankan pada strategi kewirausahaan
            modern dan ekonomi berbasis teknologi, serta <span className="font-semibold text-blue-700">
              Komputerisasi Akuntansi</span> yang mengintegrasikan keahlian akuntansi dengan sistem informasi untuk mendukung
            pengambilan keputusan keuangan yang cermat dan efisien. Melalui kombinasi antara kurikulum berbasis industri,
            kolaborasi dengan dunia usaha, serta pembelajaran yang adaptif terhadap perkembangan teknologi, Fakultas Komputer
            Universitas Ma&#39;soem berkomitmen mencetak lulusan yang kompeten, kreatif, dan siap bersaing di era transformasi digital.
          </p>
        </div>
      </section>



      {/* ===== VISI & MISI SECTION ===== */}
      <section className="relative bg-gray-100 py-32 overflow-hidden">
        {/* Background Dekoratif */}
        <div
          className="hidden md:block absolute top-1/2 left-0 -translate-y-1/2 
    -translate-x-[45%] lg:-translate-x-[65%]
    w-[95%] lg:w-[135%] h-[88%] bg-white border border-gray-200
    shadow-2xl rounded-3xl z-0 opacity-95"
        />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-12 md:gap-16 items-start pl-0 md:pl-18">
            {/* === VISI === */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:col-span-1 flex flex-col justify-start md:pl-2"
            >
              <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-4 uppercase tracking-wide">
                Visi FKOM
              </h2>
              <div className="w-16 h-[4px] bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mb-6" />
              <p className="text-gray-600 text-base md:text-lg leading-relaxed italic">
                “{profil.visi}”
              </p>
            </motion.div>

            {/* === MISI === */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-3 flex flex-col justify-center"
            >
              <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-8 text-center md:text-left uppercase tracking-wide">
                Misi FKOM
              </h2>

              {/* Grid Misi — 2 baris */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {profil.misi.map((misi, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-blue-200 hover:border-blue-400 rounded-xl p-10 shadow-sm hover:shadow-md transition min-h-[150px]"
                  >
                    <div className="text-2xl md:text-3xl font-semibold text-blue-700 mb-4">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                      {misi}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ===== TUJUAN FKOM ===== */}
          <section className="relative text-gray-800 py-28 mt-24 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-4 gap-12 md:gap-16 items-start">
              {/* === KIRI - Judul === */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="md:col-span-1 flex flex-col justify-start md:pl-2"
              >
                <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-4 uppercase tracking-wide">
                  Tujuan FKOM
                </h2>
              </motion.div>

              {/* === KANAN - Grid Tujuan === */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="md:col-span-3 flex flex-wrap justify-center gap-10"
              >
                {profil.tujuan.map((tujuan, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className={`w-full sm:w-[320px] md:w-[280px] lg:w-[300px] p-10 rounded-xl border
                ${idx === 1
                        ? "bg-gradient-to-b from-blue-500 to-blue-400 border-blue-500 text-white shadow-lg"
                        : "bg-white border-blue-200 hover:border-blue-400 text-gray-700"
                      }
                flex flex-col items-center text-center transition duration-300`}
                  >
                    <div className={`${idx === 1 ? "text-yellow-300" : "text-blue-500"} mb-4 text-4xl`}>
                      <FiUsers />
                    </div>
                    <div className={`text-2xl font-bold mb-3 ${idx === 1 ? "text-white" : "text-blue-600"}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <p className={`text-base leading-relaxed ${idx === 1 ? "text-gray-100" : "text-gray-600"}`}>
                      {tujuan}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </div>
      </section>

      {/* ===== PENERIMAAN MAHASISWA BARU (PMB) - HERO + CARDS ===== */}
      <section
        className="py-24 relative"
        style={{
          backgroundImage: "url('/background/background3.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/85 to-blue-900/85 z-0"></div>
        <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Penerimaan Calon Mahasiswa Ma&#39;soem University
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 opacity-95">
            Fakultas Komputer Ma&#39;soem University menerima mahasiswa baru tahun ajaran {currentAcademicYear} untuk semua program studi pada level vokasi dan sarjana.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <a href="https://pmb.masoemuniversity.com/" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 transition">
              Daftar Sekarang
            </a>
            <a href="https://pmb.masoemuniversity.com/#informasi" className="inline-block border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition">
              Informasi Lengkap
            </a>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-black">
            <div className="p-6 rounded-xl bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white mb-4 mx-auto">
                <FiUserPlus />
              </div>
              <h3 className="font-semibold text-lg mb-2">Daftar Online</h3>
              <p className="text-sm text-gray-700">Isi formulir pendaftaran secara online dan unggah dokumen pendukung.</p>
            </div>

            <div className="p-6 rounded-xl bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white mb-4 mx-auto">
                <FiUsers />
              </div>
              <h3 className="font-semibold text-lg mb-2">Proses Seleksi</h3>
              <p className="text-sm text-gray-700">Seleksi dilakukan berdasarkan jalur yang dipilih.</p>
            </div>

            <div className="p-6 rounded-xl bg-white/90 backdrop-blur-sm border border-white/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white mb-4 mx-auto">
                <FiCalendar />
              </div>
              <h3 className="font-semibold text-lg mb-2">Jadwal & Biaya</h3>
              <p className="text-sm text-gray-700">Lihat jadwal pendaftaran dan informasi biaya untuk masing-masing jalur masuk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FASILITAS & KEMITRAAN (MODERN MINIMALIST) ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Fasilitas & Kemitraan</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto mt-3 mb-5" />
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">Komitmen kami pada pembelajaran berkualitas melalui fasilitas modern, riset inovatif, dan kerjasama strategis dengan industri.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group relative bg-white rounded-lg border-l-4 border-blue-600 p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-blue-50 -mr-6 -mt-6 group-hover:bg-blue-100 transition"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                  <FiUsers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Fasilitas Pembelajaran</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Ruang lab jaringan, pemrograman, multimedia, dan data science dengan perangkat modern untuk mendukung praktik mahasiswa.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative bg-white rounded-lg border-l-4 border-emerald-500 p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-50 -mr-6 -mt-6 group-hover:bg-emerald-100 transition"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition">
                  <FiUserPlus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Pusat Riset & Inovasi</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Kelompok riset dan fasilitas prototyping untuk penelitian terapan, kolaborasi hibah, dan inkubasi ide inovatif.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative bg-white rounded-lg border-l-4 border-amber-500 p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-amber-50 -mr-6 -mt-6 group-hover:bg-amber-100 transition"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-4 group-hover:bg-amber-500 group-hover:text-white transition">
                  <FiCalendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Jejaring Industri & Karir</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Kemitraan untuk magang, proyek kolaboratif, rekrutmen, dan program pengembangan karir bagi lulusan.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
