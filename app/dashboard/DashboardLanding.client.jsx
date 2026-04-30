"use client"
import { useState, useEffect } from 'react'
import Sidebar from '@/app/components/Dashboard/Sidebar'
import Navbar from '@/app/components/Dashboard/Navbar'
import Footer from '@/app/components/Dashboard/Footer'
import VisitChart from './VisitChart.client'
import { FiFileText, FiUsers, FiEye, FiTrendingUp, FiRefreshCw } from 'react-icons/fi'

export default function DashboardLanding({ beritaCount = 0, prestasiCount = 0, prodiCount = 0, userCount = 0, visitCount = 0, totalArticleViews = 0, topArticles = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [series, setSeries] = useState([])
  const [labels, setLabels] = useState([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [statDays, setStatDays] = useState(14)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      try {
        const res = await fetch(`/api/metrics/visit/stats?days=${statDays}`)
        const json = await res.json()
        if (!mounted) return
        if (json && json.success && Array.isArray(json.data)) {
          setLabels(json.data.map((d) => d.date))
          setSeries(json.data.map((d) => d.count || 0))
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingSeries(false)
      }
    }
    fetchStats()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function refetch() {
      setLoadingSeries(true)
      try {
        const res = await fetch(`/api/metrics/visit/stats?days=${statDays}`)
        const json = await res.json()
        if (!mounted) return
        if (json && json.success && Array.isArray(json.data)) {
          setLabels(json.data.map((d) => d.date))
          setSeries(json.data.map((d) => d.count || 0))
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingSeries(false)
      }
    }
    refetch()
    return () => { mounted = false }
  }, [statDays])

  return (
    <main className="min-h-screen bg-slate-50">
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole="admin"
      />
   <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userData={{ role: "admin", nama: "Admin" }}
        />

          <div className="pt-16 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-2">Dashboard — Statistik Situs</h1>
              <p className="text-slate-600 mb-6">Ringkasan data saat ini untuk administrasi.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><FiFileText size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Berita</div>
                    <div className="mt-1 text-2xl font-extrabold">{beritaCount ?? 0}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-green-600"><FiTrendingUp size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Prestasi</div>
                    <div className="mt-1 text-2xl font-extrabold">{prestasiCount ?? 0}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600"><FiFileText size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Program Studi</div>
                    <div className="mt-1 text-2xl font-extrabold">{prodiCount ?? 0}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><FiUsers size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Pengguna</div>
                    <div className="mt-1 text-2xl font-extrabold">{userCount ?? 0}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><FiEye size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Kunjungan Situs</div>
                    <div className="mt-1 text-2xl font-extrabold">{visitCount ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">Total kunjungan unik (flag localStorage)</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow flex items-center gap-4">
                  <div className="p-3 bg-rose-50 rounded-lg text-rose-600"><FiTrendingUp size={22} /></div>
                  <div>
                    <div className="text-sm text-slate-500">Total Views Berita</div>
                    <div className="mt-1 text-2xl font-extrabold">{totalArticleViews ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">Jumlah total tampilan pada semua berita</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-sm text-slate-600">
                Halaman ini menampilkan statistik sederhana yang diambil langsung dari database.
              </div>

              {/* Grafik kunjungan 14 hari */}
              <div className="mt-6 max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-slate-500">Kunjungan — {statDays} hari</div>
                      <div className="text-sm text-slate-600">Total: {series.reduce((a,b)=>a+b,0)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                        {[7,14,30].map(d => (
                          <button key={d} onClick={() => setStatDays(d)} className={`px-3 py-1 text-sm rounded ${statDays===d ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{d}d</button>
                        ))}
                      </div>
                      <button onClick={() => { setLoadingSeries(true); fetch(`/api/metrics/visit/stats?days=${statDays}`).then(r=>r.json()).then(j=>{ if (j && j.success) { setLabels(j.data.map(x=>x.date)); setSeries(j.data.map(x=>x.count||0)) } }).finally(()=>setLoadingSeries(false)) }} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100" title="Refresh">
                        <FiRefreshCw />
                      </button>
                    </div>
                  </div>

                  {loadingSeries ? (
                    <div className="h-24 flex items-center justify-center text-slate-400">Memuat grafik...</div>
                  ) : series.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-slate-400">Belum ada data kunjungan.</div>
                  ) : (
                    <div>
                      <VisitChart labels={labels} data={series} />
                      <div className="text-xs text-slate-400 mt-2 flex justify-between">
                        <span>{labels[0]}</span>
                        <span>{labels[labels.length - 1]}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Top articles by views */}
              <div className="mt-6 max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow p-4">
                  <h4 className="text-lg font-semibold mb-3">Top Berita (by views)</h4>
                  {topArticles && topArticles.length > 0 ? (
                    <ul className="space-y-3">
                      {topArticles.map(a => (
                        <li key={a._id} className="flex items-start gap-3">
                          <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {/* if you have thumbnail field use it here; placeholder for now */}
                            <img src={a.gambarJudul || '/asset/check.png'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <a href={`/berita/${a.slug || a._id}`} className="text-slate-800 font-semibold hover:underline line-clamp-2">{a.judul}</a>
                            <div className="text-xs text-slate-500 mt-1">{a.views ?? 0} views</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-400">Belum ada data berita.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-auto bg-white">
            <Footer />
          </footer>
        </div>
      </div>
    </main>
  )
}
