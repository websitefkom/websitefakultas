import dbConnect from '@/lib/mongoose'
import Berita from '@/models/Berita'
import Prestasi from '@/models/Prestasi'
import Prodi from '@/models/Prodi'
import User from '@/models/User'
import Counter from '@/models/Counter'

import DashboardLanding from './DashboardLanding.client'

export default async function Page() {
  // fetch simple counts from database
  try {
    await dbConnect()
    const [beritaCount, prestasiCount, prodiCount, userCount] = await Promise.all([
      Berita.countDocuments().catch(() => 0),
      Prestasi.countDocuments().catch(() => 0),
      Prodi.countDocuments().catch(() => 0),
      User.countDocuments().catch(() => 0),
    ])

    // fetch visit counter (does not increment)
    const visitDoc = await Counter.findOne({ _id: 'visits' }).lean().catch(() => null);
    const visitCount = visitDoc && typeof visitDoc.seq === 'number' ? visitDoc.seq : 0;

    // article views: total and top articles
    const totalViewsAgg = await Berita.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]).catch(() => [])
    const totalArticleViews = (totalViewsAgg && totalViewsAgg[0] && totalViewsAgg[0].total) ? totalViewsAgg[0].total : 0
    const topArticles = await Berita.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('_id judul views slug').lean().catch(() => [])

    return (
      <DashboardLanding
        beritaCount={beritaCount}
        prestasiCount={prestasiCount}
        prodiCount={prodiCount}
        userCount={userCount}
        visitCount={visitCount}
        totalArticleViews={totalArticleViews}
        topArticles={topArticles}
      />
    )
  } catch (err) {
    console.error('Dashboard stats error', err)
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-red-600 mt-4">Gagal memuat statistik. Periksa koneksi database.</p>
        </div>
      </main>
    )
  }
}
