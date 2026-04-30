"use client"
import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { FiArrowLeft, FiArrowRight, FiChevronUp, FiSearch, FiX } from 'react-icons/fi'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

function excerptFromHtml(html, max = 140) {
    if (!html) return ''
    const tmp = html.replace(/<[^>]+>/g, '')
    return tmp.length > max ? tmp.slice(0, max).trim() + '...' : tmp
}

function readingTime(html) {
    if (!html) return '1 min'
    const text = html.replace(/<[^>]+>/g, '')
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const mins = Math.max(1, Math.round(words / 200))
    return `${mins} min`
}

export default function BeritaPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const [beritaList, setBeritaList] = useState([]) // current page items
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [showTop, setShowTop] = useState(false)
    const [scrollY, setScrollY] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [latestPosts, setLatestPosts] = useState([])
    const [kategoriList, setKategoriList] = useState([])
    const PAGE_SIZE = 6
    const [selectedCategory, setSelectedCategory] = useState('Semua')

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQuery(searchQuery.trim())
            setPage(1)
        }, 500)
        return () => clearTimeout(t)
    }, [searchQuery])

    // Sync initial state from URL params on mount (page, kategori, search)
    useEffect(() => {
        const sp = searchParams
        if (!sp) return
        const p = parseInt(sp.get('page') || sp.get('p') || '1', 10) || 1
        const k = sp.get('kategori') || sp.get('category') || 'Semua'
        const q = sp.get('q') || sp.get('search') || ''
        setPage(p)
        setSelectedCategory(k)
        setSearchQuery(q)
        // debouncedQuery will be set by debounce effect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // update URL when page/selectedCategory/debouncedQuery change (skip initial mount)
    const initialSync = useRef(true)
    useEffect(() => {
        if (initialSync.current) {
            initialSync.current = false
            return
        }
        const params = new URLSearchParams()
        if (page && page > 1) params.set('page', String(page))
        if (selectedCategory && selectedCategory !== 'Semua') params.set('kategori', selectedCategory)
        if (debouncedQuery) params.set('q', debouncedQuery)
        const url = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
        router.replace(url, { scroll: false })
    }, [page, selectedCategory, debouncedQuery, pathname, router])

    // Fetch paginated data whenever page / debouncedQuery / selectedCategory change
    useEffect(() => {
        let mounted = true
        async function loadPage() {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                params.set('page', String(page))
                params.set('limit', String(PAGE_SIZE))
                if (debouncedQuery) params.set('q', debouncedQuery)
                // request only published posts
                params.set('status', 'published')
                if (selectedCategory && selectedCategory !== 'Semua') params.set('kategori', selectedCategory)

                const res = await fetch('/api/berita?' + params.toString())
                const json = await res.json()
                if (!mounted) return
                const data = Array.isArray(json.data) ? json.data : (json.data || [])
                setBeritaList(data)
                setTotalItems(Number(json.totalItems ?? json.total ?? 0))
                setTotalPages(Number(json.totalPages ?? Math.max(1, Math.ceil((json.totalItems ?? json.total ?? 0) / PAGE_SIZE))))
            } catch (err) {
                console.error('Failed loading page', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        loadPage()
        return () => { mounted = false }
    }, [page, debouncedQuery, selectedCategory])

    // Fetch latest posts for sidebar
    useEffect(() => {
        let mounted = true
        fetch('/api/berita?page=1&limit=3&status=published')
            .then(r => r.json())
            .then(j => { if (!mounted) return; setLatestPosts(Array.isArray(j.data) ? j.data : j.data || []) })
            .catch(() => {})
        return () => { mounted = false }
    }, [])

    // Fetch category summary once
    useEffect(() => {
        let mounted = true
        fetch('/api/berita?withCategories=1')
            .then(r => r.json())
            .then(j => { if (!mounted) return; setKategoriList(Array.isArray(j.categories) ? [{ name: 'Semua', count: j.totalItems || j.total || 0 }, ...j.categories] : [{ name: 'Semua', count: j.totalItems || j.total || 0 }]) })
            .catch(() => {})
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        const onScroll = () => {
            setShowTop(window.scrollY > 300)
            setScrollY(window.scrollY)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // server-provided paginated items (already filtered by API)
    const publishedList = beritaList

    // ensure current page is within range when totalPages updates
    useEffect(() => {
        setPage(p => Math.min(p, totalPages || 1))
    }, [totalPages])

    // pageItems are the server-returned items for the current page
    const pageItems = publishedList

    const gridTopRef = useRef(null)

    const goPrev = () => setPage((p) => Math.max(1, p - 1))
    const goNext = () => setPage((p) => Math.min(totalPages, p + 1))
    const scrollToTop = () => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' })

    // Smooth-scroll grid into view when page changes to avoid visual jump
    useEffect(() => {
        const el = gridTopRef.current
        if (!el) return
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (e) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [page])

    // kategoriList and latestPosts are fetched from API and stored in state

    // featured (first item of current page)
    const featured = pageItems && pageItems.length ? pageItems[0] : null
    // two medium items to show next to featured on large screens
    const mediumItems = pageItems && pageItems.length > 2 ? pageItems.slice(1, 3) : pageItems.slice(1)
    const gridItems = pageItems ? pageItems.slice(mediumItems.length + (featured ? 1 : 0)) : []

    const placeholderImage = '/asset/check.png'

    return (
        <>
            <Navbar />

            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div className="relative w-full h-full">
                        <div style={{ transform: `translateY(${scrollY * 0.06}px)` }} className="absolute inset-0">
                            <Image
                                src="https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1400&q=80"
                                alt="Berita Background"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />
                    </div>
                </div>

                <div className="relative z-10 text-center w-full px-4">
                    <nav className="text-sm text-white/90 mb-3" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center gap-2">
                            <li><Link href="/" className="text-white/80 hover:text-white">Beranda</Link></li>
                            <li className="text-white/60">/</li>
                            <li className="text-white font-semibold">Berita</li>
                        </ol>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Berita</h1>
                    <div className="w-28 h-1 bg-[#FACC15] mx-auto mb-4 rounded opacity-95" />
                </div>
            </section>

            {/* Main Content */}
            <div className="w-full flex flex-col lg:flex-row gap-10 py-12 bg-gray-50 px-4 md:px-8 xl:px-20">
                <section ref={gridTopRef} className="flex-1 flex flex-col justify-between min-h-[75vh] md:min-h-[80vh]">
                    {/* Mobile: search + horizontal category selector (scrollable) */}
                    <div className="mb-6 lg:hidden">
                        <div className="mb-3 px-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E40AF]" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    placeholder="Search berita..."
                                    aria-label="Search berita"
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cde3ff]"
                                />
                                {searchQuery ? (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button onClick={() => { setSearchQuery(''); setPage(1); }} aria-label="Clear search" className="text-gray-400 hover:text-gray-600">
                                            <FiX />
                                        </button>
                                        <button onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); setPage(1); }} className="text-sm text-[#1E40AF] bg-white border px-2 py-1 rounded">Reset Filter</button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {kategoriList.map((kat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setSelectedCategory(kat.name); setPage(1); }}
                                    aria-pressed={kat.name === selectedCategory}
                                    className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${kat.name === selectedCategory ? 'bg-[#1E40AF] text-white' : 'bg-white border text-[#1E40AF] hover:bg-[#e6f0ff]'}`}
                                >
                                    {kat.name}
                                </button>
                            ))}
                        </div>
                                    {/* hide-scrollbar style for webkit */}
                                    <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
                    </div>
                    {/* Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page + '-' + beritaList.length}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1"
                        >
                            {loading ? (
                                // realistic skeletons: image + gradient shimmer
                                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl p-0 overflow-hidden border border-gray-100">
                                        <div className="w-full aspect-[4/3] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[pulse_1.6s_infinite]" />
                                        <div className="p-4">
                                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 mb-3 animate-[pulse_1.6s_infinite]" />
                                            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full mb-2 animate-[pulse_1.6s_infinite]" />
                                            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6 mb-2 animate-[pulse_1.6s_infinite]" />
                                        </div>
                                    </div>
                                ))
                            ) : (!loading && totalItems === 0) ? (
                                <div className="col-span-full text-center py-20">
                                    <svg className="mx-auto mb-4 w-20 h-20 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 7v10a2 2 0 0 0 2 2h10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3h10v4H7z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {searchQuery && searchQuery.trim() ? (
                                        <>
                                            <h3 className="text-lg font-semibold text-gray-700">No results found for "{searchQuery}"</h3>
                                            <p className="text-gray-500">Try a different keyword or clear your search.</p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-gray-700">Belum ada berita</h3>
                                            <p className="text-gray-500">Saat ini belum ada berita untuk ditampilkan.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Featured layout: big left + two medium right on wide screens
                                <>
                                    {featured && (
                                        <div className="col-span-full">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <article className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <Link href={`/berita/${featured._id}`} className="block group">
                                                        <div className="relative w-full h-72 lg:h-[28rem] overflow-hidden">
                                                            <Image src={featured.gambarJudul || placeholderImage} alt={featured.judul} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                                        </div>
                                                        <div className="p-6 md:p-8">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                <span className="text-xs bg-[#1E40AF] text-white px-2 py-1 rounded">Featured</span>
                                                                <div className="text-xs text-gray-500">{(featured.updatedAt || featured.publishedAt || featured.createdAt) ? new Date(featured.updatedAt || featured.publishedAt || featured.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                                                            </div>
                                                            <h2 className="text-2xl md:text-3xl font-bold text-[#1E40AF] mb-3 line-clamp-3">{featured.judul}</h2>
                                                            <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4">{excerptFromHtml(featured.isi, 260)}</p>
                                                            <div className="text-sm text-gray-500">Penulis: {featured.penulis || 'Admin'}</div>
                                                        </div>
                                                    </Link>
                                                </article>

                                                <div className="lg:col-span-1 flex flex-col gap-6">
                                                    {mediumItems.length > 0 && mediumItems.map(item => (
                                                        <article key={item._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                            <Link href={`/berita/${item._id}`} className="block group">
                                                                <div className="relative w-full h-40 overflow-hidden">
                                                                    {item.gambarJudul ? (
                                                                        <Image src={item.gambarJudul} alt={item.judul} fill className="object-cover transition-transform duration-400 group-hover:scale-105" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                                            <Image src={placeholderImage} alt="placeholder" width={120} height={80} className="object-contain" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-4">
                                                                    <div className="text-xs text-gray-500 mb-2">{(item.updatedAt || item.publishedAt || item.createdAt) ? new Date(item.updatedAt || item.publishedAt || item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                                                                    <h4 className="text-md font-semibold text-[#1E40AF] mb-1 line-clamp-2">{item.judul}</h4>
                                                                    <p className="text-sm text-gray-600 line-clamp-3">{excerptFromHtml(item.isi, 120)}</p>
                                                                </div>
                                                            </Link>
                                                        </article>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* remaining grid items */}
                                    {gridItems.map((item) => (
                                        <article key={item._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-transform transform hover:-translate-y-1 overflow-hidden flex flex-col">
                                            <Link href={`/berita/${item._id}`} className="relative block group aspect-[4/3] overflow-hidden">
                                                {item.gambarJudul ? (
                                                    <Image src={item.gambarJudul} alt={item.judul} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                                                        <Image src={placeholderImage} alt="placeholder" width={120} height={80} className="object-contain" />
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                    <div>{(item.updatedAt || item.publishedAt || item.createdAt) ? new Date(item.updatedAt || item.publishedAt || item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                                                    {latestPosts.some(p => p._id === item._id) && <span className="text-xs bg-[#FACC15] text-[#0f172a] px-2 py-0.5 rounded">Terbaru</span>}
                                                </div>
                                                <h4 className="mt-0 text-lg font-semibold text-[#1E40AF] hover:text-blue-800 mb-2 line-clamp-2"><Link href={`/berita/${item._id}`}>{item.judul}</Link></h4>
                                                <div className="mt-2 text-xs text-gray-500">{readingTime(item.isi)} • {item.penulis || 'Admin'}</div>
                                                <p className="mt-1 text-gray-600 text-sm flex-1 leading-relaxed line-clamp-3">{excerptFromHtml(item.isi, 140)}</p>
                                                <div className="mt-4 text-sm text-gray-500">Penulis: {item.penulis || 'Admin'}</div>
                                            </div>
                                        </article>
                                    ))}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                        {/* Pagination - anchored to bottom of section via flex layout */}
                        <motion.nav
                            key={`pagination-${page}-${totalItems}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28 }}
                            className="w-full flex items-center justify-between mt-6 pb-6 md:pb-10"
                            aria-label="Pagination"
                        >
                            <div className="text-sm text-gray-600">Menampilkan {beritaList.length} dari {totalItems} hasil</div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => goPrev()}
                                    disabled={page === 1}
                                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border bg-white flex items-center justify-center disabled:opacity-50"
                                    aria-label="Sebelumnya"
                                >
                                    <FiArrowLeft className="text-[#1E3A8A]" />
                                </button>

                                <div className="text-sm text-gray-700">Halaman {page} dari {totalPages}</div>

                                <button
                                    onClick={() => goNext()}
                                    disabled={page === totalPages}
                                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border bg-white flex items-center justify-center disabled:opacity-50"
                                    aria-label="Berikutnya"
                                >
                                    <FiArrowRight className="text-[#1E3A8A]" />
                                </button>
                            </div>
                        </motion.nav>
                </section>

                {/* Sidebar */}
                        <aside className="hidden lg:block w-80 flex-shrink-0 pt-2">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E40AF]" />
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                            placeholder="Search berita..."
                                            aria-label="Search berita"
                                            className="w-full pl-10 pr-10 py-2 rounded-lg border border-transparent bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#cde3ff]"
                                        />
                                        {searchQuery ? (
                                            <button onClick={() => { setSearchQuery(''); setPage(1); }} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <FiX />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h5 className="text-lg font-bold mb-4 text-[#1E40AF]">Kategori</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {kategoriList.length === 0 ? (
                                                    <div className="text-gray-500">Tidak ada kategori</div>
                                                ) : (
                                                    kategoriList.map((kat, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => { setSelectedCategory(kat.name); setPage(1); }}
                                                            aria-pressed={kat.name === selectedCategory}
                                                            className={`text-sm px-3 py-1 rounded-full focus:ring-2 focus:ring-[#cde3ff] ${kat.name === selectedCategory ? 'bg-[#1E40AF] text-white border-transparent' : 'bg-white border text-[#1E40AF] hover:bg-[#e6f0ff]'}`}
                                                            aria-label={`Filter kategori ${kat.name}`}>
                                                            {kat.name} <span className="ml-2 text-xs text-gray-500">{kat.count}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h5 className="text-lg font-bold mb-4 text-[#1E40AF]">Terbaru</h5>
                                    <div className="space-y-4">
                                        {latestPosts.length === 0 ? (
                                            <div className="text-gray-500">Belum ada posting terbaru.</div>
                                        ) : (
                                            latestPosts.map(p => (
                                                <Link key={p._id} href={`/berita/${p._id}`} className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded transition-colors">
                                                    <div className="w-16 h-12 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {p.gambarJudul ? (
                                                            <Image src={p.gambarJudul} alt={p.judul} fill className="object-cover" />
                                                        ) : (
                                                            <Image src={placeholderImage} alt="placeholder" width={64} height={48} className="object-contain" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-gray-800 line-clamp-2 break-words">{p.judul}</div>
                                                        <div className="text-xs text-gray-500">{(p.updatedAt || p.publishedAt || p.createdAt) ? new Date(p.updatedAt || p.publishedAt || p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                    <Image src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80" alt="PMB" width={320} height={180} className="rounded-lg object-cover mb-4" />
                                    <h4 className="text-blue-900 font-bold mb-2">Penerimaan Mahasiswa Baru (PMB)</h4>
                                    <p className="text-gray-700 mb-3">Fakultas Komputer Ma&#39;soem University menerima mahasiswa baru tahun ajaran 2025/2026 untuk semua program studi.</p>
                                    <a href="https://pmb.masoemuniversity.com/" className="inline-block bg-[#1E40AF] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">DAFTAR SEKARANG!</a>
                                </div>
                            </div>
                        </aside>
            </div>

            {/* Back to Top button */}
            <AnimatePresence>
                {showTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={scrollToTop}
                        aria-label="Back to top"
                        className="fixed right-6 bottom-6 z-50 w-12 h-12 rounded-full bg-[#1E40AF] text-white flex items-center justify-center shadow-lg hover:scale-105"
                    >
                        <FiChevronUp />
                    </motion.button>
                )}
            </AnimatePresence>

            <Footer />
        </>
    )
}