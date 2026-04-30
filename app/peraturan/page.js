"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FiExternalLink,
  FiCheckCircle,
  FiFileText,
  FiChevronRight,
  FiDownload,
  FiChevronUp,
} from "react-icons/fi";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Peraturan() {
  const [sectionsData, setSectionsData] = useState({});
  const [dokumenData, setDokumenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTOCMobile, setShowTOCMobile] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRefs = useRef({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resSections = await fetch("/api/akademik/peraturan");
        const resDocs = await fetch("/api/akademik/peraturan/dokumen");

        if (!resSections.ok || !resDocs.ok) {
          const msg = `API error: sections(${resSections.status}) docs(${resDocs.status})`;
          throw new Error(msg);
        }

        const sectionsJson = await resSections.json();
        const docsJson = await resDocs.json();

        setSectionsData(sectionsJson || {});
        setDokumenData(Array.isArray(docsJson.dokumen) ? docsJson.dokumen : []);
        setError(null);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err?.message || "Gagal memuat data peraturan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Scrollspy: observe sections and set active TOC item
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll progress
  useEffect(() => {
    const handle = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const percent = height > 0 ? (scrollTop / height) * 100 : 0;
      setScrollProgress(percent);
    };
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const getValue = (key) => {
    if (!sectionsData) return null;
    return sectionsData[key] || null;
  };

  const isHtmlString = (s) => {
    if (!s || typeof s !== "string") return false;
    return /<[^>]+>/.test(s);
  };

  const isMarkdownList = (s) => {
    if (!s || typeof s !== "string") return false;
    const lines = String(s).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return false;
    // check if most lines start with -, *, + or numbered '1.'
    const listLike = lines.every((l) => /^([-\*\+]\s+|\d+\.\s+)/.test(l));
    return listLike;
  };

  const parseSimpleMarkdownToHtml = (s) => {
    // Convert simple markdown lists and paragraphs to HTML string.
    const blocks = String(s).split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const out = blocks.map((block) => {
      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.every((l) => /^\d+\.\s+/.test(l))) {
        const items = lines.map((l) => `<li>${l.replace(/^\d+\.\s+/, "")}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      if (lines.every((l) => /^([-\*\+]\s+)/.test(l))) {
        const items = lines.map((l) => `<li>${l.replace(/^[-\*\+]\s+/, "")}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      // fallback paragraph — preserve single-line breaks
      const html = lines.join("<br/>\n");
      return `<p>${html}</p>`;
    }).join("\n\n");
    return out;
  };

  // Scroll to section with offset to account for fixed headers/toolbars
  const scrollToSection = (key) => {
    const el = sectionRefs.current[key];
    if (!el) return;
    const headerOffset = 92; // adjust if your navbar has different height
    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = Math.max(elementPosition - headerOffset, 0);
    // set active immediately for better feedback
    setActiveSection(key);
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    // temporary highlight
    el.classList.add("ring-4", "ring-[#FACC15]/40");
    setTimeout(() => el.classList.remove("ring-4", "ring-[#FACC15]/40"), 1400);
  };

  const sections = [
    { key: "ketentuan", title: "Ketentuan Umum", type: "text" },
    {
      key: "kebijakan",
      title: "Kebijakan Seleksi Mahasiswa Baru",
      type: "list",
    },
    {
      key: "persyaratan",
      title: "Persyaratan Seleksi Mahasiswa Baru",
      type: "list",
    },
    { key: "jalur", title: "Jalur-jalur Seleksi", type: "text" },
    {
      key: "penetapan",
      title: "Penetapan Keputusan Kelulusan Seleksi",
      type: "text",
    },
    { key: "dokumen", title: "Dokumen-Dokumen", type: "docs" },
  ];

  // (Expand/Collapse controls were removed per request)

  if (loading) {
    // skeleton shimmer
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-12">
          <div className="space-y-6">
            <div className="h-8 w-3/4 bg-gray-200 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 bg-gray-200 rounded-md animate-pulse col-span-1 md:col-span-2" />
              <div className="h-40 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
        <div
          className="h-1 bg-gradient-to-r from-[#1E3A8A] to-[#17326B] transition-all"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center">
        <Image
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
          alt="Peraturan Background"
          fill
          className="object-cover brightness-[0.55]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">
              Peraturan Akademik
            </h1>
            <div className="mx-auto mt-4 w-28 h-1 rounded bg-[#FACC15]" />
            <p className="mt-4 text-white/90 max-w-2xl mx-auto">
              Pedoman Akademik dan Ketentuan Seleksi Mahasiswa Baru di Fakultas
              Komputer Ma&apos;soem University.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content with TOC */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* TOC - sticky on desktop, collapsible on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28">
              <div className="text-sm font-semibold text-[#1E3A8A] mb-3">
                Daftar Isi
              </div>
              <nav className="space-y-2 text-sm">
                <div className="w-56 bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-sm">
                  {sections.map((s) => (
                    <a
                      key={s.key}
                      href={`#${s.key}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(s.key);
                      }}
                      className={`block px-3 py-2 rounded-md transition-colors duration-300 flex items-center gap-2 ${activeSection === s.key ? "text-[#1E3A8A] font-semibold" : "text-gray-700 hover:text-[#1E3A8A]"}`}
                    >
                      <FiChevronRight
                        className={`text-sm ${activeSection === s.key ? "text-[#1E3A8A]" : "text-gray-400"}`}
                      />
                      <span className="text-sm">{s.title}</span>
                    </a>
                  ))}
                </div>
              </nav>
            </div>
          </aside>

          <div className="col-span-1 lg:col-span-9">
            {/* Mobile TOC */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowTOCMobile((v) => !v)}
                className="w-full text-left px-4 py-3 bg-white border rounded-md flex items-center justify-between"
              >
                <span className="font-semibold text-[#1E3A8A]">Daftar Isi</span>
                <span className="text-gray-500">
                  {showTOCMobile ? "Tutup" : "Buka"}
                </span>
              </button>
              <div
                className={`mt-2 overflow-hidden transition-all duration-300 ${showTOCMobile ? "max-h-96" : "max-h-0"}`}
              >
                <div className="bg-white p-3 rounded-md shadow-sm">
                  {sections.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        scrollToSection(s.key);
                        setShowTOCMobile(false);
                      }}
                      className={`w-full text-left block py-2 text-sm flex items-center gap-2 ${activeSection === s.key ? "text-[#1E3A8A] font-semibold" : "text-gray-700 hover:text-[#1E3A8A]"}`}
                    >
                      <FiChevronRight
                        className={`text-xs ${activeSection === s.key ? "text-[#1E3A8A]" : "text-gray-400"}`}
                      />
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls removed: Expand/Collapse and Read Mode */}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                <strong className="font-semibold">Terjadi kesalahan:</strong>
                <div className="text-sm mt-1">{error}</div>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-12">
              {sections.map((sec, idx) => {
                const value = getValue(sec.key);
                return (
                  <motion.section
                    id={sec.key}
                    key={sec.key}
                    ref={(el) => (sectionRefs.current[sec.key] = el)}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.6,
                      delay: idx * 0.12,
                      ease: "easeOut",
                    }}
                    className="p-6 rounded-2xl"
                  >
                    <div
                      className={`rounded-2xl p-6 transition-colors duration-300 bg-gradient-to-r from-white to-[#F8FAFC]`}
                    >
                      <header className="mb-4">
                        <h2 className="text-2xl font-bold text-[#0b244d]">
                          {sec.title}
                        </h2>
                        <div className="mt-2 w-20 h-1 bg-[#FACC15] rounded" />
                      </header>

                      <article className="prose prose-lg max-w-3xl text-gray-700">
                        {sec.type === "text" && (
                          <div>
                            {value ? (
                              isHtmlString(String(value)) ? (
                                <div className="prose prose-lg max-w-3xl text-gray-700" dangerouslySetInnerHTML={{ __html: String(value) }} />
                              ) : isMarkdownList(String(value)) ? (
                                <div
                                  className="prose prose-lg max-w-3xl text-gray-700"
                                  dangerouslySetInnerHTML={{ __html: parseSimpleMarkdownToHtml(String(value)) }}
                                />
                              ) : (
                                <>
                                  {String(value)
                                    .split(/\n\s*\n/)
                                    .filter(Boolean)
                                    .map((para, i) => (
                                      <p
                                        key={i}
                                        className="mb-4 whitespace-pre-line leading-relaxed text-justify"
                                      >
                                        {para}
                                      </p>
                                    ))}
                                </>
                              )
                            ) : (
                              <p className="italic text-gray-500">Belum ada data.</p>
                            )}
                          </div>
                        )}

                        {sec.type === "list" && (
                          <div>
                            {Array.isArray(value) ? (
                              // Render array as a semantic list
                              <div>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                  {value.map((item, i) => (
                                    <li key={i} className="leading-relaxed">
                                      {isHtmlString(String(item)) ? (
                                        <span dangerouslySetInnerHTML={{ __html: String(item) }} />
                                      ) : isMarkdownList(String(item)) ? (
                                        <span dangerouslySetInnerHTML={{ __html: parseSimpleMarkdownToHtml(String(item)) }} />
                                      ) : (
                                        <span className="whitespace-pre-line">{String(item)}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : value ? (
                              isHtmlString(String(value)) ? (
                                <div dangerouslySetInnerHTML={{ __html: String(value) }} />
                              ) : (
                                <>
                                  {String(value)
                                    .split(/\n\s*\n/)
                                    .filter(Boolean)
                                    .map((para, i) => (
                                      <p
                                        key={i}
                                        className="mb-4 whitespace-pre-line leading-relaxed text-justify"
                                      >
                                        {para}
                                      </p>
                                    ))}
                                </>
                              )
                            ) : (
                              <p className="italic text-gray-500">Belum ada data.</p>
                            )}
                          </div>
                        )}

                        {sec.type === "docs" && (
                          <div className="space-y-3">
                            {dokumenData.length > 0 ? (
                              dokumenData.map((doc, i) => (
                                <div
                                  key={i}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      window.open(
                                        `https://docs.google.com/viewer?url=${encodeURIComponent(doc.cloudinaryUrl || doc.url)}&embedded=true`,
                                        "_blank",
                                      );
                                  }}
                                  onClick={() =>
                                    window.open(
                                      `https://docs.google.com/viewer?url=${encodeURIComponent(doc.cloudinaryUrl || doc.url)}&embedded=true`,
                                      "_blank",
                                    )
                                  }
                                  className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded border border-gray-100 hover:shadow-md transition-shadow bg-white cursor-pointer"
                                >
                                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white text-[#1E3A8A] rounded">
                                    <FiFileText className="w-6 h-6 sm:w-5 sm:h-5" />
                                  </div>
                                  <div className="flex-1 text-gray-800 min-w-0">
                                    <div
                                      className="font-medium line-clamp-2"
                                      title={doc.dokumenName}
                                    >
                                      {doc.dokumenName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Diunggah:{" "}
                                      {new Date(
                                        doc.uploadedAt,
                                      ).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-3 mt-2 sm:mt-0">
                                    <a
                                      href={doc.cloudinaryUrl || doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-[#1E3A8A] hover:underline flex items-center gap-2 transition-transform duration-200 hover:translate-x-1"
                                    >
                                      <FiExternalLink className="inline-block" />{" "}
                                      <span className="hidden sm:inline">
                                        Lihat
                                      </span>
                                    </a>
                                    <a
                                      href={doc.cloudinaryUrl || doc.url}
                                      download={doc.dokumenName || "dokumen"}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-gray-600 hover:text-[#1E3A8A] flex items-center gap-2 transition-transform duration-200 hover:translate-x-1"
                                    >
                                      <FiDownload className="inline-block" />{" "}
                                      <span className="hidden sm:inline">
                                        Unduh
                                      </span>
                                    </a>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="italic text-gray-500">
                                Belum ada dokumen tersedia.
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-6 bottom-6 z-50 bg-[#1E3A8A] text-white p-3 rounded-full shadow-lg hover:bg-[#17326b] transition"
          aria-label="Kembali ke atas"
        >
          <FiChevronUp />
        </button>
      )}
    </>
  );
}
