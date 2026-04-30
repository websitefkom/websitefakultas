import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/mongoose";
import Prestasi from "@/models/Prestasi";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { FiCalendar } from "react-icons/fi";
import { FaTrophy, FaFilePdf } from "react-icons/fa";

export async function generateMetadata({ params }) {
  await dbConnect();
  const { id } = await params;
  const doc = await Prestasi.findById(id).lean();
  if (!doc) return { title: "Prestasi tidak ditemukan" };
  const title = `${doc.prestasi?.judul || "Prestasi"} — Fakultas Komputer`;
  const description = doc.prestasi?.penyelenggara || "";
  const image =
    (doc.bukti && (doc.bukti.url_foto || doc.bukti.url_sertifikat)) ||
    "/images/prestasi-placeholder.jpg";
  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
  };
}

export default async function Page({ params }) {
  await dbConnect();
  const { id } = await params;
  const doc = await Prestasi.findById(id).lean();
  if (!doc) return notFound();

  // latest prestasi for sidebar (exclude current)
  const latestPrestasi = await Prestasi.find({ _id: { $ne: doc._id } })
    .sort({ "prestasi.tanggal": -1, created_at: -1 })
    .limit(3)
    .lean();

  const tanggal = doc.prestasi?.tanggal
    ? new Date(doc.prestasi.tanggal).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content - 70% */}
          <main className="lg:col-span-8">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-gray-800">
                    Beranda
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link
                    href="/prestasi"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Prestasi
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-800 font-semibold line-clamp-1">
                  {doc.prestasi?.judul}
                </li>
              </ol>
            </nav>

            <article className="bg-white rounded-2xl shadow-lg p-6">
              <header>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
                  {doc.prestasi?.judul}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 font-semibold">
                      <FaTrophy /> {doc.role || "Peserta"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400" />{" "}
                    <span>{tanggal}</span>
                  </div>
                </div>
              </header>

              {/* Featured image */}
              {doc.bukti?.url_foto ? (
                <div className="w-full rounded-xl overflow-hidden mb-6 shadow-lg">
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={doc.bukti.url_foto}
                      alt={doc.prestasi?.judul || "Bukti Prestasi"}
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>
                </div>
              ) : null}

              {/* Description / penyelenggara */}
              <div className="prose prose-lg prose-blue max-w-none text-gray-700 break-words">
                <p className="mb-2">
                  <strong>Penyelenggara:</strong>{" "}
                  {doc.prestasi?.penyelenggara || "-"}
                </p>
                {doc.prestasi?.deskripsi ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: doc.prestasi.deskripsi }}
                  />
                ) : null}
              </div>

              {/* Certificate CTA card */}
              {doc.bukti?.url_sertifikat && (
                <div className="mt-6">
                  <div className="border rounded-xl p-4 bg-gradient-to-r from-yellow-50 to-white shadow-md flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center text-2xl">
                      <FaFilePdf />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        Sertifikat Prestasi
                      </div>
                      <div className="text-xs text-gray-500">
                        Klik untuk melihat sertifikat resmi (PDF)
                      </div>
                    </div>
                    <div>
                      <a
                        href={doc.bukti.url_sertifikat}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Lihat Sertifikat
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {/* Additional section: gallery or notes (optional) */}
          </main>

          {/* Sidebar - 30% */}
          <aside className="lg:col-span-4">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h5 className="text-lg font-bold mb-4 text-[#1E40AF]">
                  Prestasi Terbaru
                </h5>
                <div className="space-y-3">
                  {latestPrestasi.length === 0 ? (
                    <div className="text-gray-500">
                      Belum ada prestasi lain.
                    </div>
                  ) : (
                    latestPrestasi.map((p) => (
                      <Link
                        key={p._id}
                        href={`/prestasi/${p._id}`}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="w-16 h-12 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.bukti?.url_foto ? (
                            <Image
                              src={p.bukti.url_foto}
                              alt={p.prestasi?.judul || "thumb"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 line-clamp-2 break-words">
                            {p.prestasi?.judul}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.prestasi?.tanggal
                              ? new Date(p.prestasi.tanggal).getFullYear()
                              : ""}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 sticky top-24">
                <Image
                  src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"
                  alt="PMB"
                  width={320}
                  height={180}
                  className="rounded-lg object-cover mb-4"
                />
                <h4 className="text-blue-900 font-bold mb-2">
                  Penerimaan Mahasiswa Baru (PMB)
                </h4>
                <p className="text-gray-700 mb-3">
                  Fakultas Komputer Ma&#39;soem University menerima mahasiswa
                  baru untuk semua program studi.
                </p>
                <a
                  href="https://pmb.masoemuniversity.com/"
                  className="inline-block bg-[#1E40AF] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  DAFTAR SEKARANG!
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
