import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Counter, { getNextSequence } from '@/models/Counter';
import VisitStat from '@/models/VisitStat';

// POST: increment total visits and return the new count
export async function POST(request) {
  try {
    await dbConnect();
    const seq = await getNextSequence('visits');

    // also increment today's bucket (YYYY-MM-DD)
    try {
      const today = new Date().toISOString().slice(0, 10);
      await VisitStat.findOneAndUpdate(
        { date: today },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
    } catch (e) {
      // don't fail entire request if daily logging fails
      // eslint-disable-next-line no-console
      console.error('VisitStat increment failed', e && e.message ? e.message : e);
    }

    return NextResponse.json({ success: true, count: seq });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET: return current total visits (without increment)
export async function GET() {
  try {
    await dbConnect();
    const doc = await Counter.findOne({ _id: 'visits' }).lean();
    const count = doc && typeof doc.seq === 'number' ? doc.seq : 0;
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
