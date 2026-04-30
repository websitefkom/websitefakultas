import Image from 'next/image'
import Link from 'next/link'
import dbConnect from '@/lib/mongoose'
import Berita from '@/models/Berita'
import { notFound } from 'next/navigation'
import ShareButtons from './ShareButtons.client'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import ViewIncrement from '../ViewIncrement.client'
import { FiCalendar, FiUser, FiClock, FiTag, FiShare2, FiHome, FiChevronRight } from 'react-icons/fi'

export async function generateMetadata({ params }) {
  await dbConnect()
  const { id } = await params
  // accept slug or custom id
  const doc = await Berita.findOne({ $or: [{ _id: id }, { slug: id }] }).lean()
  if (!doc) return { title: 'Berita — Tidak ditemukan' }
  const title = `${doc.judul} — Fakultas Komputer`
  const description = (doc.isi || '').replace(/<[^>]+>/g, '').slice(0, 160)
  const image = doc.gambarJudul || '/asset/check.png'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
  }
}

function readingTime(html) {
  if (!html) return '1 min'
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min`
}

export default async function Page({ params }) {
  await dbConnect()
  const { id } = await params
  const doc = await Berita.findOne({ $or: [{ _id: id }, { slug: id }] }).lean()
  if (!doc) return notFound()

  // related: same category, exclude current
  const related = await Berita.find({ kategori: doc.kategori, _id: { $ne: doc._id }, status: 'published' }).sort({ createdAt: -1 }).limit(3).lean()

  // latest for sidebar (exclude current)
  const latest = await Berita.find({ _id: { $ne: doc._id }, status: 'published' }).sort({ createdAt: -1 }).limit(3).lean()

  // If no related items found, fall back to latest posts so the section remains populated
  const relatedToShow = (related && related.length) ? related : (latest || [])

  const tanggal = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const articlePathId = doc.slug || String(doc._id)
  const currentUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/berita/${articlePathId}` : `/berita/${articlePathId}`

  return (
    <>
      <Navbar />
      {/* View increment client: triggers once per browser; use slug when available */}
      <ViewIncrement id={articlePathId} />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><FiHome /> Beranda</Link>
          <FiChevronRight className="text-gray-400" />
          <Link href="/berita" className="text-gray-600 hover:text-gray-800">Berita</Link>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-800 font-semibold line-clamp-1">{doc.judul}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <main className="lg:col-span-8">
            <article className="bg-white rounded-2xl shadow p-6">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-900 mb-4 break-words">{doc.judul}</h1>

              <div className="flex flex-col md:flex-row md:items-center md:gap-6 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2"><FiCalendar className="text-gray-400" /> <span>{tanggal}</span></div>
                <div className="hidden md:block">•</div>
                <div className="flex items-center gap-2"><FiUser className="text-gray-400" /> <span>{doc.penulis || 'Admin'}</span></div>
                <div className="hidden md:block">•</div>
                <div className="flex items-center gap-2"><FiTag className="text-gray-400" /> <span className="px-2 py-1 bg-yellow-100 rounded text-sm">{doc.kategori || 'Umum'}</span></div>
                <div className="hidden md:block">•</div>
                <div className="flex items-center gap-2"><FiClock className="text-gray-400" /> <span>{readingTime(doc.isi)}</span></div>
              </div>

              {/* Inline Share Buttons with subtle separators */}
              <div className="border-y py-3 my-4">
                <ShareButtons url={currentUrl} title={doc.judul} />
              </div>

              {/* Featured image below title/share */}
              {doc.gambarJudul ? (
                <div className="w-full aspect-video relative rounded-xl overflow-hidden mb-6 shadow-md">
                  <Image src={doc.gambarJudul} alt={doc.judul} fill className="object-cover" />
                </div>
              ) : null}

              <div className="mt-6 berita-content prose prose-lg prose-blue max-w-none break-words text-gray-800 [&_a]:text-blue-600 [&_a]:underline [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:list-decimal [&_img]:w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-md leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: doc.isi }} />
              </div>
            </article>

            {/* Related */}
            <section className="mt-10">
              <h3 className="text-xl font-bold mb-4">Berita Terkait</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedToShow.map(r => (
                  <Link key={r._id} href={`/berita/${r.slug || r._id}`} className="block bg-white rounded-lg overflow-hidden border hover:shadow transition">
                    <div className="w-full h-40 relative">
                      {r.gambarJudul ? (
                        <Image src={r.gambarJudul} alt={r.judul} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-500 mb-1">{r.kategori}</div>
                      <div className="font-semibold text-gray-800 mb-2 line-clamp-2">{r.judul}</div>
                      <div className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h5 className="text-lg font-bold mb-4 text-[#1E40AF]">Terbaru</h5>
                <div className="space-y-4">
                  {latest.map(p => (
                    <Link key={p._id} href={`/berita/${p.slug || p._id}`} className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="w-20 h-14 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.gambarJudul ? (
                          <Image src={p.gambarJudul} alt={p.judul} fill className="object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 line-clamp-2 break-words">{p.judul}</div>
                        <div className="text-xs text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 sticky top-24">
                <Image src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80" alt="PMB" width={320} height={180} className="rounded-lg object-cover mb-4" />
                <h4 className="text-blue-900 font-bold mb-2">Penerimaan Mahasiswa Baru (PMB)</h4>
                <p className="text-gray-700 mb-3">Fakultas Komputer Ma&#39;soem University menerima mahasiswa baru untuk semua program studi.</p>
                <a href="https://pmb.masoemuniversity.com/" className="inline-block bg-[#1E40AF] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">DAFTAR SEKARANG!</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  )
}
