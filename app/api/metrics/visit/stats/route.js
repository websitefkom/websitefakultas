import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import VisitStat from '@/models/VisitStat';

// GET: return last N days of visit stats (default 30)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days')) || 30, 1), 365);

    // build list of date keys (YYYY-MM-DD) from oldest -> newest
    const dates = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }

    const docs = await VisitStat.find({ date: { $in: dates } }).lean();
    const map = {};
    docs.forEach((r) => { map[r.date] = r.count || 0 });

    const data = dates.map((dt) => ({ date: dt, count: map[dt] || 0 }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
