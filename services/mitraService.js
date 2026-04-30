import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const COLLECTION = 'mitra';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadLogo(file) {
  const arrBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrBuf);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mitra' },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
  return result.secure_url;
}

function buildIdQuery(id) {
  if (!id) return null;
  const s = String(id);
  if (/^[0-9a-fA-F]{24}$/.test(s)) {
    try { return { _id: new ObjectId(s) }; } catch (e) { /* fall through */ }
  }
  return { _id: s };
}

export async function listMitra({ aktif } = {}) {
  const client = await clientPromise;
  const db = client.db();
  const filter = {};
  if (aktif === true || aktif === 'true') filter.aktif = true;
  return db.collection(COLLECTION).find(filter).sort({ urutan: 1, createdAt: 1 }).toArray();
}

export async function createMitra(formData) {
  const nama = (formData.get('nama') || '').trim();
  if (!nama) throw Object.assign(new Error('Nama mitra wajib diisi'), { status: 400 });

  const link = (formData.get('link') || '').trim();
  const urutan = parseInt(formData.get('urutan') || '0', 10) || 0;
  const aktif = formData.get('aktif') !== 'false';

  let logo = null;
  const logoFile = formData.get('logo');
  if (logoFile && typeof logoFile.arrayBuffer === 'function' && logoFile.size > 0) {
    logo = await uploadLogo(logoFile);
  }

  const client = await clientPromise;
  const db = client.db();
  const doc = { nama, logo, link, urutan, aktif, createdAt: new Date(), updatedAt: new Date() };
  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateMitra(formData) {
  const id = formData.get('id');
  if (!id) throw Object.assign(new Error('ID mitra tidak ditemukan'), { status: 400 });
  const query = buildIdQuery(id);
  if (!query) throw Object.assign(new Error('ID tidak valid'), { status: 400 });

  const update = { updatedAt: new Date() };
  const nama = (formData.get('nama') || '').trim();
  if (nama) update.nama = nama;
  const link = formData.get('link');
  if (link !== null) update.link = (link || '').trim();
  const urutan = formData.get('urutan');
  if (urutan !== null) update.urutan = parseInt(urutan, 10) || 0;
  const aktif = formData.get('aktif');
  if (aktif !== null) update.aktif = aktif !== 'false';

  const logoFile = formData.get('logo');
  if (logoFile && typeof logoFile.arrayBuffer === 'function' && logoFile.size > 0) {
    update.logo = await uploadLogo(logoFile);
  }

  const client = await clientPromise;
  const db = client.db();
  await db.collection(COLLECTION).updateOne(query, { $set: update });
  return { success: true };
}

export async function deleteMitra(id) {
  const query = buildIdQuery(id);
  if (!query) throw Object.assign(new Error('ID tidak valid'), { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection(COLLECTION).deleteOne(query);
  return { success: true };
}
