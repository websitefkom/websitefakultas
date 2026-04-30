import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const COLLECTION = 'berita';

export async function GET(req, context) {
  try {
    // context may expose params as an async object in Next.js dynamic routes.
    // Await params before using its properties to avoid the runtime warning:
    // "params should be awaited before using its properties"
    const { params } = context;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    // build id query: accept custom IDs (BRT-...) or legacy ObjectId
    let idQuery;
    const s = String(id);
    if (s.startsWith('BRT-')) {
      idQuery = { _id: s };
    } else if (/^[0-9a-fA-F]{24}$/.test(s)) {
      idQuery = { _id: new ObjectId(s) };
    } else {
      idQuery = { _id: s };
    }
    const doc = await db.collection(COLLECTION).findOne(idQuery);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    console.error('GET /api/berita/[id] error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
