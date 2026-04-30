import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper: generate a simple incremental code like TAUT-001
async function generateCode(db) {
  const docs = await db.collection('tautan').find({ code: { $exists: true } }).project({ code: 1 }).toArray();
  const nums = docs
    .map(d => {
      const m = (d.code || '').match(/TAUT-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return `TAUT-${String(next).padStart(3, '0')}`;
}

// Helper: resolve identifier string to a mongo filter (accepts code or ObjectId)
function idToFilter(id) {
  if (!id) return null;
  const codePattern = /^TAUT-\d+$/;
  if (codePattern.test(id)) return { filter: { code: id }, by: 'code' };
  try {
    return { filter: { _id: new ObjectId(id) }, by: 'objectId' };
  } catch (e) {
    return null;
  }
}

// GET: List all tautan
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'websitefkom');
    const data = await db.collection('tautan').find().sort({ createdAt: -1 }).toArray();

    const formatted = data.map(doc => ({
      _id: doc.code || doc._id.toString(),
      title: doc.title,
      desc: doc.desc,
      url: doc.url,
      code: doc.code || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Tambah tautan
export async function POST(request) {
  try {
    const { title, desc, url } = await request.json();
    if (!title || !url) {
      return NextResponse.json({ success: false, message: 'Judul dan URL wajib diisi!' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'websitefkom');

    const code = await generateCode(db);
    const doc = { title, desc, url, code, createdAt: new Date(), updatedAt: new Date() };
    const insert = await db.collection('tautan').insertOne(doc);
    const newDoc = await db.collection('tautan').findOne({ _id: insert.insertedId });

    // 🔹 Convert _id ke string
    const formatted = { ...newDoc, _id: newDoc.code || newDoc._id.toString() };

    return NextResponse.json({ success: true, data: formatted, message: 'Tautan berhasil ditambahkan' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Update tautan
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });

    const { title, desc, url } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'websitefkom');

    const resolved = idToFilter(id);
    if (!resolved) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const old = await db.collection('tautan').findOne(resolved.filter);
    if (!old) return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });

    await db.collection('tautan').updateOne(resolved.filter, { $set: { title, desc, url, updatedAt: new Date() } });
    const updated = await db.collection('tautan').findOne(resolved.filter);

    // Return code as _id when available
    const formatted = { ...updated, _id: updated.code || updated._id.toString() };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus tautan
export async function DELETE(request) {
  try {
    // Ambil id dari query string, bukan params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    const resolved = idToFilter(id);
    if (!resolved) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const old = await db.collection('tautan').findOne(resolved.filter);
    if (!old) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    await db.collection('tautan').deleteOne(resolved.filter);

    return NextResponse.json({ success: true, message: "Tautan berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}