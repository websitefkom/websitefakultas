"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      duration: 0.5,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Helper: truncate text at word boundary and append ellipsis when needed
function truncateText(text, max = 120) {
  if (!text) return "";
  const s = String(text).trim();
  if (s.length <= max) return s;
  const trimmed = s.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(" ");
  const finalText = lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed;
  return finalText.trimEnd() + "...";
}

// Normalize prodi record for robust rendering
function normalizeProdiRecord(p) {
  if (!p) return { _displayId: null, nama: 'Program Studi', deskripsi: '', gambar: null };
  const id = p._id || p.id || null;
  const nama = p.nama || p.name || p.nama_prodi || 'Program Studi';
  const deskripsi = p.deskripsi || p.description || '';
  let gambar = null;
  // possible fields
  if (p.gambar) gambar = p.gambar;
  else if (p.image) gambar = p.image;
  else if (p.thumbnailAkreditasi) gambar = p.thumbnailAkreditasi;
  // Cloudinary object may be nested
  if (gambar && typeof gambar === 'object') {
    if (gambar.secure_url) gambar = gambar.secure_url;
    else if (gambar.url) gambar = gambar.url;
    else gambar = null;
  }
  // ensure leading slash for local public assets
  if (gambar && !/^https?:\/\//i.test(gambar) && !gambar.startsWith('/')) gambar = '/' + gambar;
  return { ...p, _displayId: id, nama, deskripsi, gambar };
}

const LandingPage = () => {
  // For seamless infinite carousel
  // 1. partnersPerView & setPartnersPerView must be declared first

  const [partnersPerView, setPartnersPerView] = useState(4);
  // 2. currentPartnerIndex depends on partnersPerView
  const [currentPartnerIndex, setCurrentPartnerIndex] = useState(0); // Will set to partnersPerView after mount

  const [isTransitioning, setIsTransitioning] = useState(true);

  // Fetch prodi, berita & mitra for homepage
  const [partners, setPartners] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [beritaList, setBeritaList] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchHomeData() {
      try {
        const [pRes, bRes, mRes] = await Promise.all([
          fetch('/api/akademik/prodi'),
          fetch('/api/berita?limit=3'),
          fetch('/api/mitra?aktif=true'),
        ]);
        const pJson = pRes.ok ? await pRes.json() : null;
        const bJson = bRes.ok ? await bRes.json() : null;
        const mJson = mRes.ok ? await mRes.json() : null;

        const prodiData = Array.isArray(pJson) ? pJson : (pJson && Array.isArray(pJson.data) ? pJson.data : []);
        const beritaData = Array.isArray(bJson) ? bJson : (bJson && Array.isArray(bJson.data) ? bJson.data : []);
        const partnersData = Array.isArray(mJson) ? mJson : (mJson && Array.isArray(mJson.data) ? mJson.data : []);

        if (!mounted) return;
        setProdiList(prodiData || []);
        setBeritaList(beritaData || []);
        setPartners(partnersData || []);
      } catch (err) {
        console.error('Failed to fetch home data', err);
      } finally {
        if (mounted) setLoadingHome(false);
      }
    }
    fetchHomeData();
    return () => { mounted = false };
  }, []);

  // initialize current index after partners state exists
  useEffect(() => {
    setCurrentPartnerIndex(Math.min(partnersPerView, partners.length));
  }, [partnersPerView, partners.length]);

  // Tracking kunjungan dipindah ke VisitTracker.client.jsx di layout.js
  // normalized prodi list for rendering (keep hook order stable)
  const normalizedProdi = useMemo(() => {
    try {
      return (prodiList || []).map(normalizeProdiRecord);
    } catch (e) {
      return prodiList || [];
    }
  }, [prodiList]);
  // Compute current academic year automatically, e.g. "2026/2027"
  const currentAcademicYear = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}/${y + 1}`;
  }, []);
  // For seamless loop: repeat partners if needed to fill viewport, then clone for wrapping
  const cycledPartners = useMemo(() => {
    if (partners.length === 0) return [];
    // Repeat partners enough times to fill at least partnersPerView slots
    const repeated = [];
    while (repeated.length < partnersPerView) {
      repeated.push(...partners);
    }
    return repeated.slice(0, Math.max(partnersPerView, repeated.length));
  }, [partners, partnersPerView]);

  const headLen = Math.min(partnersPerView, cycledPartners.length);
  const cloneHead = cycledPartners.slice(-headLen);
  const cloneTail = cycledPartners.slice(0, headLen);
  const extendedPartners = [...cloneHead, ...cycledPartners, ...cloneTail];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setPartnersPerView(1);
      else if (window.innerWidth < 1024) setPartnersPerView(2);
      else if (window.innerWidth < 1280) setPartnersPerView(3);
      else setPartnersPerView(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Agar semua partner bisa tampil, bahkan jika tidak habis dibagi partnersPerView
  const maxIndex = Math.max(cycledPartners.length - partnersPerView, 0);

  const nextPartners = () => {
    if (isTransitioning) return; // cegah spam klik
    setIsTransitioning(true);
    setCurrentPartnerIndex((prev) => prev + 1);
  };

  const prevPartners = () => {
    if (isTransitioning) return; // cegah spam klik
    setIsTransitioning(true);
    setCurrentPartnerIndex((prev) => prev - 1);
  };

  // Handle seamless loop after transition
  useEffect(() => {
    // Always keep dependency array size/order the same
    if (!isTransitioning) return;
    if (currentPartnerIndex === 0) {
      // Jump to last real slide (no transition)
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentPartnerIndex(cycledPartners.length);
      }, 500); // match transition duration
    } else if (currentPartnerIndex === cycledPartners.length + headLen) {
      // Jump to first real slide (no transition)
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentPartnerIndex(headLen);
      }, 500);
    } else {
      setIsTransitioning(true);
    }
  }, [currentPartnerIndex, cycledPartners.length, headLen, isTransitioning]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero Section ala Blocksy/Elementor */}
      <section
        id="beranda"
        className="relative flex items-center justify-center min-h-screen bg-gray-50 overflow-hidden p-0 m-0"
      >
        {/* Navbar overlap */}
        <div className="absolute top-0 left-0 w-full z-50">
          <Navbar />
        </div>
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-white/30"></div>
        </div>
        {/* Content ala Elementor/Blocksy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center md:items-start justify-center text-center md:text-left px-4 md:px-8 lg:px-16 py-16 w-full max-w-8xl md:ml-12 lg:ml-24"
        >
          {/* Heading kecil */}
          <motion.h2
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl font-semibold text-blue-800 mb-3 tracking-widest uppercase"
          >
            Universitas Ma&#39;soem
          </motion.h2>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="w-40 h-0.5 bg-yellow-400 rounded-full mb-8 mx-0"
          />

          {/* Heading utama */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-blue-900 mb-8 leading-tight"
          >
            FAKULTAS
            <br />
            KOMPUTER
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-black mb-8 max-w-xl mx-auto md:mx-0 font-normal"
          >
            Mengukir Karya, Merangkul Bakat: Fakultas Komputer Ma&#39;soem
            University, Tempat Berkembangnya Generasi Kreatif Pencipta
            Perubahan.
          </motion.p>
        </motion.div>
      </section>

      {/* Tentang Kami Section */}
      <motion.section
        id="tentang"
        className="relative bg-white overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-col md:flex-row md:items-stretch md:justify-between">
          {/* Left: Title and Image */}
          <motion.div
            variants={itemVariants}
            className="md:w-1/2 w-full flex flex-col items-start justify-center relative overflow-hidden min-h-[400px] lg:min-h-[500px]"
          >
            <div className="absolute inset-0 w-full h-full z-0">
              <Image
                src="/background/fotohome.jpg"
                alt="Gedung kampus dan suasana belajar"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                quality={100}
                className="w-full h-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <motion.div
              variants={itemVariants}
              className="relative z-10 p-8 md:p-12 lg:p-16 w-full"
            >
              <motion.h2
                variants={itemVariants}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              >
                Yuk, Kenal Lebih Dekat
              </motion.h2>
              <motion.div
                variants={itemVariants}
                className="w-32 md:w-90 h-1 bg-yellow-400 rounded-full mb-3 mx-auto md:mx-20"
              />
            </motion.div>
          </motion.div>

          {/* Right: Description */}
          <motion.div
            variants={itemVariants}
            className="md:w-1/2 w-full flex flex-col items-center md:items-start justify-center bg-blue-700 bg-opacity-95 p-8 md:p-12 lg:p-16 min-h-[400px] lg:min-h-[500px]"
          >
            <motion.p
              variants={itemVariants}
              className="text-white text-base md:text-lg leading-relaxed mb-4 text-center md:text-left"
            >
              Fakultas Komputer Universitas Ma&#39;soem merupakan pusat
              pengembangan pendidikan di bidang teknologi informasi dan bisnis
              digital yang berorientasi pada inovasi, profesionalisme, dan
              etika.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-white text-base md:text-lg leading-relaxed mb-4 text-center md:text-left"
            >
              Fakultas ini menaungi tiga program studi unggulan, yaitu
              <span className="font-semibold text-yellow-300"> Sistem Informasi </span>
              yang berfokus pada analisis data dan pengelolaan sistem bisnis
              berbasis teknologi, <span className="font-semibold text-yellow-300"> Bisnis Digital </span>
              yang menekankan pada strategi kewirausahaan modern dan ekonomi
              berbasis teknologi, serta <span className="font-semibold text-yellow-300"> Komputerisasi Akuntansi</span>
              yang mengintegrasikan keahlian akuntansi dengan sistem informasi
              untuk mendukung pengambilan keputusan keuangan yang cermat dan
              efisien.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-white text-base md:text-lg leading-relaxed mb-8 text-center md:text-left"
            >
              Melalui kombinasi antara kurikulum berbasis industri, kolaborasi
              dengan dunia usaha, serta pembelajaran yang adaptif terhadap
              perkembangan teknologi, Fakultas Komputer Universitas Ma&#39;soem
              berkomitmen mencetak lulusan yang kompeten, kreatif, dan siap
              bersaing di era transformasi digital.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex justify-center md:justify-start w-full"
            >
              <a
                href="https://teknik.widyatama.ac.id/profil/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3 text-lg font-semibold text-blue-900 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="inline-block">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <span>Baca Lebih Lanjut</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Program Studi Section */}
      <motion.section
        id="akademik"
        className="py-20 bg-white"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="container mx-auto px-4 text-center">
          {/* Judul */}
          <motion.h2
            variants={cardVariants}
            className="text-3xl sm:text-4xl font-bold mb-6 text-gray-800"
          >
            PROGRAM STUDI
          </motion.h2>

          <p className="text-gray-700 mb-6">
            FAKULTAS KOMPUTER MA&#39;SOEM UNIVERSITY
          </p>

          {/* Tombol */}
          <a
            href="https://fkom-masoemuniversity.vercel.app/profil"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3 text-lg font-semibold text-blue-900 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span className="inline-block">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
            <span>Ada Apa Aja Sih?</span>
          </a>

          {/* Grid Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-15">
            {loadingHome ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={i} variants={cardVariants} className="bg-white rounded-xl overflow-hidden shadow-md p-6 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 mb-4 rounded" />
                  <div className="h-4 bg-gray-200 w-3/4 rounded mb-2" />
                  <div className="h-3 bg-gray-200 w-full rounded mb-1" />
                </motion.div>
              ))
            ) : prodiList && prodiList.length > 0 ? (
              normalizedProdi.slice(0, 3).map((item, idx) => {
                const prodiId = item._displayId || item._id || item.id || null;
                const key = prodiId || item.nama || `prodi-${idx}`;
                const href = prodiId ? `/prodi/${prodiId}` : null;
                const imgSrc = item.gambar && typeof item.gambar === 'string' && item.gambar.trim() !== '' ? item.gambar : '/asset/check.png';
                return (
                  <motion.div key={key} variants={cardVariants} initial="hidden" animate="visible" className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    {href ? (
                      <Link href={href} className="block relative">
                        <div className="relative overflow-hidden w-full h-64">
                          <Image
                            src={imgSrc}
                            alt={item.nama || 'Program Studi'}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transform transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{item.nama}</h3>
                          <p className="text-gray-600 mb-4">{truncateText(item.deskripsi, 120)}</p>
                          <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                            <span>Pelajari Lebih Lanjut</span>
                            <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="block relative">
                        <div className="relative overflow-hidden w-full h-64">
                          <Image
                            src={imgSrc}
                            alt={item.nama || 'Program Studi'}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transform transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{item.nama}</h3>
                          <p className="text-gray-600 mb-4">{truncateText(item.deskripsi, 120)}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-600">Belum ada data program studi.</div>
            )}
          </div>
        </div>
      </motion.section>
      {/* Penerimaan Mahasiswa Baru */}
      <section
        className="py-20 text-white relative"
        style={{
          backgroundImage: "url('/background/background3.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/80 to-blue-900/80 z-0"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-8">
            Penerimaan Calon Mahasiswa Ma&#39;soem University
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Fakultas Komputer Ma&#39;soem University menerima mahasiswa baru
            tahun ajaran {currentAcademicYear} untuk semua program studi pada level vokasi
            dan sarjana.
          </p>
          <button className="bg-white text-blue-600 px-10 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors transform hover:scale-105">
            Daftar Sekarang
          </button>
        </div>
      </section>

      {/* Berita Terbaru */}
      <motion.section
        id="berita"
        className="py-20 bg-gray-100"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            variants={cardVariants}
            className="text-3xl sm:text-4xl font-bold text-center mb-2 text-gray-800"
          >
            BERITA TERBARU
          </motion.h2>

          <motion.p
            variants={cardVariants}
            className="text-gray-700 text-center mb-12"
          >
            Fakultas Komputer Ma&#39;soem University
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingHome ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={i} variants={cardVariants} className="group bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 p-6 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 mb-4 rounded" />
                  <div className="h-4 bg-gray-200 w-3/4 rounded mb-2" />
                  <div className="h-3 bg-gray-200 w-full rounded mb-1" />
                </motion.div>
              ))
            ) : beritaList && beritaList.length > 0 ? (
              beritaList.map((news) => (
                <motion.div key={news._id || news.slug || news.judul} variants={cardVariants} initial="hidden" animate="visible" className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                  <Link href={`/berita/${news._id || news.slug}`} className="block relative">
                    <div className="relative overflow-hidden w-full h-64">
                      <Image
                        src={news.gambarJudul || '/asset/check.png'}
                        alt={news.judul || 'Berita'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-4 text-gray-500">
                        <Calendar size={18} className="mr-2" />
                        <span>{news.updatedAt ? new Date(news.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{news.judul}</h3>
                      <p className="text-gray-600 mb-4">{(news.isi || '').replace(/<[^>]+>/g, '').slice(0, 120) + (news.isi && news.isi.length > 120 ? '...' : '')}</p>
                      <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                        <span>Baca Selengkapnya</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600">Belum ada berita untuk ditampilkan.</div>
            )}
          </div>
        </div>
      </motion.section>

      {(!loadingHome && partners.length === 0) ? null : (
      <motion.section
        className="py-20 bg-gradient-to-b from-white to-gray-50"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            variants={cardVariants}
            className="text-4xl font-bold text-center mb-4 text-gray-800"
          >
            Mitra Kami
          </motion.h2>

          <motion.p
            variants={cardVariants}
            className="text-gray-600 text-center mb-12 max-w-2xl mx-auto"
          >
            Berkolaborasi dengan industri terkemuka untuk mengembangkan
            pendidikan berkualitas
          </motion.p>

          <div className="relative px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={prevPartners}
                className="absolute left-0 z-10 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:bg-white"
              >
                <ChevronLeft size={28} className="text-gray-700" />
              </button>

              <div className="mx-2 sm:mx-8 md:mx-12 overflow-hidden w-full">
                <div
                  className={`flex ${
                    isTransitioning
                      ? "transition-transform duration-500 ease-out"
                      : ""
                  }`}
                  style={{
                    transform: `translateX(-${
                      (currentPartnerIndex * 100) / partnersPerView
                    }%)`,
                  }}
                  onTransitionEnd={() => {
                    if (currentPartnerIndex === 0) {
                      setIsTransitioning(false);
                      setCurrentPartnerIndex(cycledPartners.length);
                    } else if (currentPartnerIndex === cycledPartners.length + headLen) {
                      setIsTransitioning(false);
                      setCurrentPartnerIndex(headLen);
                    } else {
                      setIsTransitioning(false);
                    }
                  }}
                >
                  {extendedPartners.map((partner, index) => {
                    const partnerSafe = partner || {};
                    const stableId = partnerSafe && (partnerSafe._id ?? partnerSafe.id ?? partnerSafe.kode ?? partnerSafe.code ?? partnerSafe.nama ?? partnerSafe.name);
                    const itemKey = `${stableId ?? 'partner'}-${index}`;

                    // Resolve logo URL from possible fields and nested objects
                    let logoSrc = partnerSafe.logo ?? partnerSafe.image ?? partnerSafe.logoUrl ?? partnerSafe.logo_url ?? partnerSafe.url ?? null;
                    if (logoSrc && typeof logoSrc === 'object') {
                      logoSrc = logoSrc.secure_url ?? logoSrc.url ?? logoSrc.src ?? null;
                    }
                    if (!logoSrc || typeof logoSrc !== 'string' || logoSrc.trim() === '') {
                      logoSrc = '/asset/check.png';
                    }

                    const displayName = partnerSafe.nama || partnerSafe.name || partnerSafe.nm || 'Mitra';

                    return (
                      <motion.div
                        key={itemKey}
                        variants={cardVariants}
                        className={`w-full sm:w-1/2 md:w-1/3 xl:w-1/4 flex-shrink-0 px-3 sm:px-4 flex items-center justify-center`}
                        style={{ maxWidth: `${100 / partnersPerView}%` }}
                      >
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="relative flex items-center justify-center w-full h-32 sm:h-36 md:h-40 lg:h-44 xl:h-48 group">
                            <div className="flex items-center justify-center w-40 h-24 sm:w-44 sm:h-28 md:w-48 md:h-32 lg:w-52 lg:h-36 xl:w-56 xl:h-40">
                              <Image
                                src={logoSrc}
                                alt={displayName}
                                width={180}
                                height={90}
                                className="object-contain mx-auto group-hover:scale-105 transition-transform duration-300"
                                style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
                                priority={true}
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-center text-sm text-gray-600">{displayName}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={nextPartners}
                className="absolute right-0 z-10 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:bg-white"
              >
                <ChevronRight size={28} className="text-gray-700" />
              </button>
            </div>

            {/* Navigation Dots for Mobile */}
            <div className="flex justify-center mt-8 gap-2 md:hidden">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPartnerIndex(headLen + idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPartnerIndex === headLen + idx
                      ? "bg-blue-600 w-4"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>
      )}
      {/* Footer */}
      <Footer />
    </div>
  );
};
export default LandingPage;
