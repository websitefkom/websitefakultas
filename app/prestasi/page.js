"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { FiSearch, FiAward, FiChevronDown } from "react-icons/fi";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

// fetched data will replace sample data
const mahasiswaList = [];
const dosenList = [];

const TABS = ["All", "Mahasiswa", "Dosen", "Prodi", "Fakultas"];

function detectBadge(title = "") {
  const t = title.toLowerCase();
  if (/juara\s*1|juara1|first\s*place|gold\b/i.test(t))
    return { label: "Juara 1", color: "bg-yellow-400 text-black" };
  if (/gold\b|emas|medal/i.test(t))
    return { label: "Gold", color: "bg-yellow-300 text-black" };
  if (/internasional|international|intl/i.test(t))
    return { label: "Internasional", color: "bg-blue-600 text-white" };
  return null;
}

export default function Prestasi() {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [showTop, setShowTop] = useState(false);
  const [allItemsFetched, setAllItemsFetched] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allItems = useMemo(
    () =>
      allItemsFetched.length
        ? allItemsFetched
        : [
            ...mahasiswaList.map((i) => ({ ...i, type: "Mahasiswa" })),
            ...dosenList.map((i) => ({ ...i, type: "Dosen" })),
          ],
    [allItemsFetched],
  );

  useEffect(() => {
    let mounted = true;
    async function fetchPrestasi() {
      try {
        setLoading(true);
        const res = await fetch("/api/prestasi");
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Fetch failed");
        const mapped = (json.data || []).map((doc) => {
          const p = doc.prestasi || {};
          const bukti = doc.bukti || {};
          return {
            id: doc._id,
            title: p.judul || "Untitled",
            desc: p.penyelenggara || doc.raw_desc || "",
            year: p.tanggal
              ? new Date(p.tanggal).getFullYear()
              : doc.created_at
                ? new Date(doc.created_at).getFullYear()
                : "",
            image:
              bukti.url_foto ||
              bukti.url_sertifikat ||
              "/images/prestasi-placeholder.jpg",
            type:
              (doc.role || "").toString().toLowerCase() === "dosen"
                ? "Dosen"
                : (doc.role || "").toString().toLowerCase() === "prodi"
                  ? "Prodi"
                  : (doc.role || "").toString().toLowerCase() === "fakultas"
                    ? "Fakultas"
                    : "Mahasiswa",
            raw: doc,
          };
        });
        if (!mounted) return;
        setAllItemsFetched(mapped);
      } catch (err) {
        console.error("Failed fetching prestasi", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPrestasi();
    return () => {
      mounted = false;
    };
  }, []);

  const years = useMemo(() => {
    const s = new Set(allItems.map((i) => i.year).filter(Boolean));
    return ["All", ...Array.from(s).sort((a, b) => Number(b) - Number(a))];
  }, [allItems]);

  const filtered = useMemo(() => {
    return allItems
      .filter((it) => {
        if (tab !== "All" && it.type !== tab) return false;
        if (yearFilter !== "All" && String(it.year) !== String(yearFilter))
          return false;
        if (query && !it.title.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  }, [allItems, tab, query, yearFilter]);

  const featured = filtered.length ? filtered[0] : null;
  const featuredBadge = featured ? detectBadge(featured.title) : null;

  const scrollToTop = () =>
    typeof window !== "undefined" &&
    window.scrollTo({ top: 0, behavior: "smooth" });

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;
  useEffect(() => {
    setPage(1);
  }, [tab, query, yearFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const cardHover = {
    whileHover: { y: -6, boxShadow: "0 18px 40px rgba(16,24,40,0.08)" },
    whileTap: { scale: 0.995 },
  };

  return (
    <>
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
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#07103a]/75" />
        <div className="relative z-10 container mx-auto px-6 py-20 max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Hall of Fame — Prestasi Fakultas Komputer
          </h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">
            Sorot capaian terbaik mahasiswa dan dosen FKOM — inovasi, kompetisi,
            dan publikasi internasional.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Spotlight (horizontal hero card) */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="mx-auto w-full max-w-6xl">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 relative">
                <div className="md:flex">
                  <div className="md:w-2/5 w-full h-56 md:h-64 relative bg-gray-100">
                    {featured.image ? (
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e6f0ff] to-[#eef7ff]">
                        <FiAward className="w-12 h-12 text-[#1E3A8A]" />
                      </div>
                    )}
                    {/* subtle glow for featured */}
                    <div className="absolute inset-0 ring-1 ring-yellow-100/30 pointer-events-none" />
                  </div>

                  <div className="md:w-3/5 w-full p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="text-sm text-gray-500">
                        {featured.type} • {featured.year}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                          {featured.title}
                        </h3>
                        {featuredBadge && (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${featuredBadge.color}`}
                          >
                            {featuredBadge.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-gray-600 leading-relaxed max-w-2xl">
                        {featured.desc}
                      </p>
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/prestasi/${featured.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A8A] text-white text-sm font-semibold hover:opacity-95"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Toolbar: Tabs (left) and Search/Filter (right) */}
        <div className="w-full mb-6">
          <div className="mx-auto max-w-6xl bg-white rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 ring-1 ring-gray-100">
            <div className="flex items-center gap-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${tab === t ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul..."
                  className="w-full md:w-64 pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="py-2 px-3 rounded-lg border border-gray-200 text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${query}-${yearFilter}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginated.map((it, idx) => {
              const badge = detectBadge(it.title);
              return (
                <motion.article
                  key={`${it.title}-${idx}`}
                  {...cardHover}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col"
                  whileHover={{
                    y: -6,
                    boxShadow: "0 12px 30px rgba(16,24,40,0.06)",
                  }}
                >
                  <div className="relative w-full h-44 md:h-48">
                    {it.image ? (
                      <Image
                        src={it.image}
                        alt={it.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e6f0ff] to-[#eef7ff]">
                        <FiAward className="w-8 h-8 text-[#1E3A8A]" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-md font-bold text-gray-900 line-clamp-2 break-words">
                        {it.title}
                      </h3>
                      <div className="text-sm text-gray-500">{it.year}</div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3 flex-1">
                      {it.desc}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="text-xs text-gray-500">{it.type}</div>
                      {badge ? (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/prestasi/${it.id}`}
                        className="text-sm font-semibold text-blue-600"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Pagination controls */}
        {filtered.length > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {Math.min(filtered.length, PAGE_SIZE)} dari{" "}
              {filtered.length} hasil
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-gray-700">
                Halaman {page} dari {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Tidak ada prestasi yang cocok dengan kriteria pencarian.
          </div>
        )}

        {/* Back to top button */}
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Kembali ke Atas"
            className="fixed right-6 bottom-6 z-50 w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-lg hover:scale-105"
          >
            ↑
          </motion.button>
        )}
      </main>

      <Footer />
    </>
  );
}
