'use client'
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";
import { MotionConfig, motion } from 'framer-motion';
import { Link, Globe } from 'lucide-react';

export default function Tautan() {
  const [tautanList, setTautanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tautan")
      .then(res => res.json())
      .then(data => {
        setTautanList(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch(() => {
        setTautanList([]);
        setLoading(false);
      });
  }, []);

  function handleOpenExternal(url) {
    // langsung buka di tab baru tanpa konfirmasi
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      // fallback: set location (rare)
      window.location.href = url;
    }
  }

  const cardEnter = { opacity: 0, y: 8 };
  const cardAnimate = { opacity: 1, y: 0 };

  return (
    <MotionConfig transition={{ duration: 0.32, ease: [0.2, 0.9, 0.2, 1] }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <Image
          src="/background/gedung2.jpg"
          alt="Campus Background"
          fill
          className="object-cover brightness-50"
          priority
        />
               <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-[#0b1b4d]/60" />
        <div className="relative z-10 text-center w-full px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg flex items-center justify-center gap-3">
            <Globe className="w-7 h-7 text-yellow-400" />
            Tautan Penting
          </h1>
          <div className="w-24 h-1 bg-[#facc15] mx-auto mb-4" />
          <p className="text-md md:text-lg text-white/85 max-w-xl mx-auto">
            Beberapa tautan penting untuk civitas akademika Fakultas Komputer Ma’soem University.
          </p>
        </div>
      </section>

      {/* Tautan Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-b from-white to-gray-100 min-h-[40vh]">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl p-6 h-44 shadow-sm border border-gray-100" aria-hidden>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tautanList.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-16">
                  Belum ada tautan.
                </div>
              )}

              {tautanList.map((item, idx) => (
                <motion.div
                  key={item._id || idx}
                  initial={cardEnter}
                  animate={cardAnimate}
                  transition={{ delay: idx * 0.04 }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenExternal(item.url)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleOpenExternal(item.url); }
                      if (e.key === ' ') { e.preventDefault(); handleOpenExternal(item.url); }
                    }}
                    className="group bg-white rounded-xl shadow-md transition-transform duration-200 ease-out overflow-hidden flex flex-col border-2 border-blue-50 hover:scale-[1.02] hover:shadow-lg hover:border-[#facc15] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 p-6 h-44 cursor-pointer select-none"
                    aria-label={`Buka tautan ${item.title}`}
                    title={item.title}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#eef6ff] flex items-center justify-center text-[#2563eb]">
                        <Link className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#0f172a] group-hover:text-[#0b244d] truncate">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.desc}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-xs text-gray-500">{item.domain || ''}</div>
                      <div className="inline-flex items-center gap-2 text-sm text-[#2563eb] font-semibold">
                        <span>Kunjungi</span>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M14 3h7v7" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 14L21 3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 21H3V3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </MotionConfig>
  );
}