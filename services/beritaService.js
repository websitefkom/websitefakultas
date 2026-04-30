import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongoose';
import Berita from '@/models/Berita';
import { getNextSequence } from '@/models/Counter';

const COLLECTION = 'berita';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function ensureUniqueSlug(db, baseSlug, excludeId = null) {
  let slug = baseSlug || '';
  if (!slug) slug = String(Date.now());
  let candidate = slug;
  let i = 0;
  while (true) {
    const filter = { slug: candidate };
    if (excludeId) {
      try {
        if (String(excludeId).startsWith('BRT-')) {
          filter._id = { $ne: excludeId };
        } else if (/^[0-9a-fA-F]{24}$/.test(String(excludeId))) {
          filter._id = { $ne: new ObjectId(excludeId) };
        } else {
          filter._id = { $ne: excludeId };
        }
      } catch (e) {
        filter._id = { $ne: excludeId };
      }
    }
    const exists = await db.collection(COLLECTION).findOne(filter);
    if (!exists) return candidate;
    i += 1;
    candidate = `${slug}-${i}`;
    if (i > 1000) return `${candidate}-${Date.now()}`;
  }
}

function buildIdQuery(id) {
  if (!id) return { _id: id };
  const s = String(id);
  if (s.startsWith('BRT-')) return { _id: s };
  if (/^[0-9a-fA-F]{24}$/.test(s)) {
    try { return { _id: new ObjectId(s) }; } catch (e) { return { _id: s }; }
  }
  return { _id: s };
}

async function uploadToCloudinary(fileOrBuffer, folder = 'berita') {
  try {
    let buffer;
    if (fileOrBuffer.arrayBuffer) {
      const arrBuf = await fileOrBuffer.arrayBuffer();
      buffer = Buffer.from(arrBuf);
    } else {
      buffer = fileOrBuffer;
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(buffer);
    });

    return { success: true, url: result.secure_url };
  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: err.message };
  }
}

export async function listBerita({ page = 1, limit = 20, q = '', status = '', slug = '', kategori = '', withCategories = false } = {}) {
  const client = await clientPromise;
  const db = client.db();

  if (slug) {
    const item = await db.collection(COLLECTION).findOne({ slug });
    if (!item) throw Object.assign(new Error('Not found'), { status: 404 });
    return { data: item };
  }

  const filter = {};
  if (q) {
    const regex = { $regex: q, $options: 'i' };
    filter.$or = [{ judul: regex }, { isi: regex }];
  }
  if (status && status !== 'all') filter.status = status;
  if (kategori && kategori.toLowerCase() !== 'semua' && kategori !== 'All') filter.kategori = kategori;

  const total = await db.collection(COLLECTION).countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const berita = await db
    .collection(COLLECTION)
    .find(filter)
    .sort({ _id: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(limit)
    .toArray();

  let categories;
  if (withCategories) {
    const agg = await db.collection(COLLECTION).aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: { $ifNull: ['$kategori', 'Umum'] }, count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]).toArray();
    categories = agg;
  }

  return { data: berita, totalItems: total, total, totalPages, categories };
}

export async function createBerita(formData) {
  // fields
  const judul = formData.get('judul');
  let isi = formData.get('isi');
  const gambarJudul = formData.get('gambarJudul');
  const kategori = formData.get('kategori') || 'Umum';
  const status = formData.get('status') || 'draft';
  const penulis = formData.get('penulis') || 'Admin';
  const tagsRaw = formData.get('tags') || '';
  const tags = tagsRaw ? String(tagsRaw).split(',').map(t => t.trim()).filter(Boolean) : [];
  let slug = (formData.get('slug') || '').trim();
  const views = parseInt(formData.get('views') || '0', 10) || 0;

  let gambarJudulUrl = null;
  if (gambarJudul && typeof gambarJudul === 'object' && gambarJudul.size > 0) {
    const upload = await uploadToCloudinary(gambarJudul, 'berita');
    if (upload.success) gambarJudulUrl = upload.url;
  }

  // replace base64 images in isi
  const dataUrlRegex = /<img[^>]+src=["'](data:[^"']+)["'][^>]*>/g;
  let match;
  const replacements = [];
  while ((match = dataUrlRegex.exec(isi)) !== null) {
    const fullTag = match[0];
    const dataUrl = match[1];
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const uploaded = await uploadToCloudinary(buffer, 'berita');
    if (uploaded.success) {
      const newTag = fullTag.replace(dataUrl, uploaded.url);
      replacements.push({ old: fullTag, newTag });
    }
  }
  replacements.forEach((r) => { isi = isi.replace(r.old, r.newTag); });

  // Save via mongoose model
  await dbConnect();
  const client = await clientPromise;
  const db = client.db();
  const base = slugify(slug || judul || String(Date.now()));
  const uniqueSlug = await ensureUniqueSlug(db, base, null);

  const seq = await getNextSequence('berita');
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const datePart = `${dd}${mm}${yy}`;
  const num = String(seq).padStart(3, '0');
  const customId = `BRT-${datePart}-${num}`;

  const doc = new Berita({
    _id: customId,
    judul,
    isi,
    gambarJudul: gambarJudulUrl,
    kategori,
    status,
    penulis,
    tags,
    slug: uniqueSlug,
    views,
  });

  const saved = await doc.save();
  return saved;
}

export async function updateBerita(formData) {
  const id = formData.get('id');
  const judul = formData.get('judul');
  let isi = formData.get('isi');
  const gambarJudul = formData.get('gambarJudul');
  const kategori = formData.get('kategori');
  const status = formData.get('status');
  const penulis = formData.get('penulis');
  const tagsRaw = formData.get('tags');
  const slug = formData.get('slug');

  let gambarJudulUrl = null;
  if (gambarJudul && typeof gambarJudul === 'object' && gambarJudul.size > 0) {
    const upload = await uploadToCloudinary(gambarJudul, 'berita');
    if (upload.success) gambarJudulUrl = upload.url;
  }

  if (typeof isi === 'string' && isi.includes('data:')) {
    const dataUrlRegex = /<img[^>]+src=["'](data:[^"']+)["'][^>]*>/g;
    let match;
    const replacements = [];
    while ((match = dataUrlRegex.exec(isi)) !== null) {
      const fullTag = match[0];
      const dataUrl = match[1];
      const base64 = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const uploaded = await uploadToCloudinary(buffer, 'berita');
      if (uploaded.success) {
        const newTag = fullTag.replace(dataUrl, uploaded.url);
        replacements.push({ old: fullTag, newTag });
      }
    }
    replacements.forEach((r) => { isi = isi.replace(r.old, r.newTag); });
  }

  const updateFields = { updatedAt: new Date() };
  const isMeaningful = (v) => v !== null && v !== undefined && String(v).toLowerCase() !== 'null' && String(v).toLowerCase() !== 'undefined' && String(v).trim() !== '';
  if (isMeaningful(judul)) updateFields.judul = judul;
  if (isMeaningful(isi)) updateFields.isi = isi;
  if (isMeaningful(kategori)) updateFields.kategori = kategori;
  if (isMeaningful(status)) updateFields.status = status;
  if (isMeaningful(penulis)) updateFields.penulis = penulis;
  if (tagsRaw !== null) {
    const parsedTags = tagsRaw ? String(tagsRaw).split(',').map(t=>t.trim()).filter(Boolean) : [];
    updateFields.tags = parsedTags;
  }
  if (isMeaningful(slug)) updateFields.slug = slug;
  if (gambarJudulUrl) updateFields.gambarJudul = gambarJudulUrl;

  const client = await clientPromise;
  const db = client.db();
  if (updateFields.status === 'published') {
    const existing = await db.collection(COLLECTION).findOne(buildIdQuery(id));
    const finalJudul = updateFields.judul !== undefined ? updateFields.judul : existing?.judul;
    const finalIsi = updateFields.isi !== undefined ? updateFields.isi : existing?.isi;
    const isMeaningfulLocal = (v) => v !== null && v !== undefined && String(v).toLowerCase() !== 'null' && String(v).toLowerCase() !== 'undefined' && String(v).trim() !== '';
    if (!isMeaningfulLocal(finalJudul) || !isMeaningfulLocal(finalIsi)) {
      throw Object.assign(new Error('Tidak dapat mempublikasikan: judul dan isi harus diisi.'), { status: 400 });
    }
  }

  if (!updateFields.slug) {
    if (updateFields.judul) {
      const base = slugify(updateFields.judul);
      updateFields.slug = await ensureUniqueSlug(db, base, id);
    }
  } else {
    const normalized = slugify(updateFields.slug);
    updateFields.slug = await ensureUniqueSlug(db, normalized, id);
  }

  await db.collection(COLLECTION).updateOne(buildIdQuery(id), { $set: updateFields });
  return { success: true };
}

export async function deleteBerita(id) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection(COLLECTION).deleteOne(buildIdQuery(id));
  return { success: true };
}
