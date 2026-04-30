"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiUsers, FiBookOpen, FiUserPlus, FiCalendar } from "react-icons/fi";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProdiDetail() {
  const { id } = useParams();
  const [prodi, setProdi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/akademik/prodi/${id}`);
        if (!res.ok) throw new Error("Gagal memuat data prodi");
        const data = await res.json();
        setProdi(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-blue-700 font-semibold animate-pulse">
            Memuat data program studi...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const year = new Date().getFullYear();
  const currentAcademicYear = `${year}/${year + 1}`;

  if (!prodi) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-gray-600 mb-4">
            Data program studi tidak ditemukan.
          </p>
          <Link
            href="/prodi"
            className="text-blue-700 font-semibold hover:underline"
          >
            ← Kembali ke daftar Prodi
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Header Gambar */}
      <section className="relative h-[60vh] w-full flex items-center justify-center">
        <Image
          src={prodi.gambar || "/default-prodi.jpg"}
          alt={prodi.nama}
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
            {prodi.nama}
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mb-4" />
        </div>
      </section>

      {/* Summary card */}
      <section className="relative z-20 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12 -mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto ring-1 ring-gray-100"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
                <FiBookOpen className="text-blue-600 text-2xl" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {prodi.nama}
                </h3>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed max-w-3xl">
                  {prodi.deskripsi}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex w-full md:w-auto flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 justify-between">
                <div className="flex items-center gap-3">
                  {prodi.tahun_akreditasi && (
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
                      Tahun Akreditasi:{" "}
                      <span className="font-semibold text-gray-800 ml-2">
                        {prodi.tahun_akreditasi}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {prodi.dokumenUrl_akreditasi && (
                    <a
                      href={prodi.dokumenUrl_akreditasi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      📄 {prodi.dokumenName_akreditasi || "Lihat Dokumen"}
                    </a>
                  )}

                  <Link
                    href="/prodi"
                    className="text-blue-700 font-medium hover:underline whitespace-nowrap"
                  >
                    ← Kembali
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Detail Section - Visi Misi Tujuan */}
      <section className="relative bg-gray-100 py-20 overflow-hidden">
        <div
          className="hidden md:block absolute top-1/2 left-0 -translate-y-1/2 
            -translate-x-[45%] lg:-translate-x-[65%]
            w-[95%] lg:w-[135%] h-[88%] bg-white border border-gray-200
            shadow-2xl rounded-3xl z-0 opacity-95"
        />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-12 md:gap-16 items-start">
            {/* Visi */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:col-span-1 flex flex-col justify-start md:pl-2"
            >
              <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-4 uppercase tracking-wide">
                Visi
              </h2>
              <div className="w-16 h-[4px] bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mb-6" />
              <p className="text-gray-600 text-base md:text-lg leading-relaxed italic">
                {prodi.visi}
              </p>
            </motion.div>

            {/* Misi */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-3 flex flex-col justify-center"
            >
              <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-8 text-center md:text-left uppercase tracking-wide">
                Misi
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {prodi.misi?.map((misi, index) => (
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

          {/* TUJUAN Section */}
          {prodi.tujuan?.length > 0 && (
            <section className="relative text-gray-800 py-24 mt-24 rounded-3xl overflow-hidden">
              <div className="grid md:grid-cols-4 gap-12 md:gap-16 items-start">
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="md:col-span-1 flex flex-col justify-start md:pl-2"
                >
                  <h2 className="text-4xl md:text-4xl font-bold text-blue-700 mb-4 uppercase tracking-wide">
                    Tujuan
                  </h2>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="md:col-span-3 flex flex-wrap justify-center gap-10"
                >
                  {prodi.tujuan.map((tujuan, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                      className={`w-full sm:w-[320px] md:w-[280px] lg:w-[300px] p-10 rounded-xl border
                        ${
                          idx === 1
                            ? "bg-gradient-to-b from-blue-500 to-blue-400 border-blue-500 text-white shadow-lg"
                            : "bg-white border-blue-200 hover:border-blue-400 text-gray-700"
                        }
                        flex flex-col items-center text-center transition duration-300`}
                    >
                      <div
                        className={`${idx === 1 ? "text-yellow-300" : "text-blue-500"} mb-4 text-4xl`}
                      >
                        <FiUsers />
                      </div>
                      <div
                        className={`text-2xl font-bold mb-3 ${idx === 1 ? "text-white" : "text-blue-600"}`}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <p
                        className={`text-base leading-relaxed ${idx === 1 ? "text-gray-100" : "text-gray-600"}`}
                      >
                        {tujuan}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>
          )}
        </div>
      </section>

      {/* ===== PENERIMAAN MAHASISWA BARU (PMB) ===== */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/15 rounded-full -mr-36 -mt-36"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Pendaftaran Terbuka</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Bergabunglah TA {currentAcademicYear}
            </h2>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl leading-relaxed">
              Daftar menjadi bagian dari {prodi.nama}. Jenjang vokasi dan sarjana dengan berbagai jalur masuk tersedia.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap mb-10">
            <a href="https://pmb.masoemuniversity.com/" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 transition">
              Daftar Sekarang
            </a>
            <a href="https://pmb.masoemuniversity.com/#informasi" className="inline-block border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition">
              Informasi Lengkap
            </a>
          </div>
        </div>

        {/* 3 Cards dengan colored left borders */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg p-5 hover:bg-blue-800/60 transition"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 mb-3">
              <FiUserPlus className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Daftar Online</h4>
            <p className="text-xs text-blue-100/70 leading-relaxed">Isi formulir pendaftaran dan unggah dokumen.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-black/40 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg p-5 hover:bg-blue-800/60 transition"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 mb-3">
              <FiUsers className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Proses Seleksi</h4>
            <p className="text-xs text-blue-100/70 leading-relaxed">Seleksi sesuai jalur yang Anda pilih.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-black/40 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg p-5 hover:bg-blue-800/60 transition"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-400/20 text-blue-300 mb-3">
              <FiCalendar className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Jadwal & Biaya</h4>
            <p className="text-xs text-blue-100/70 leading-relaxed">Detail jadwal dan informasi biaya selengkapnya.</p>
          </motion.div>
        </div>
      </section>

      {/* Pemisah visual sebelum Footer */}
      <div className="bg-gray-100 h-10 flex items-center justify-center">
        <div className="w-16 h-[3px] bg-yellow-400 rounded-full" />
      </div>

      <Footer />
    </>
  );
}