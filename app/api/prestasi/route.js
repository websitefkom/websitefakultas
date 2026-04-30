import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Prestasi from '@/models/Prestasi';
import { z } from 'zod';
import { generateId, formatId } from '@/lib/prestasiId';
import { uploadToCloudinary, deleteCloudinaryAsset, publicIdFromUrl } from '@/lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const dynamic = 'force-dynamic';

// ID generation helpers moved to `lib/prestasiId.js` (generateId, formatId)

export async function GET(request) {
  try {
    await dbConnect();
    const all = await Prestasi.find({}).sort({ created_at: -1 }).lean();
    return NextResponse.json({ success: true, data: all });
  } catch (err) {
    console.error('GET /api/prestasi error', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

const PostSchema = z.object({
  role: z.enum(['mahasiswa', 'dosen', 'prodi', 'fakultas']),
  identitas: z.object({
    nim: z.string().optional(),
    nama: z.string().optional(),
    program_studi: z.string().optional(),
  }).optional(),
  prestasi: z.object({
    judul: z.string(),
    tingkat: z.enum(['Nasional', 'Universitas', 'Internasional', 'Provinsi']),
    penyelenggara: z.string().optional(),
    tanggal: z.string(),
  }),
  bukti: z.object({ url_sertifikat: z.string().optional(), url_foto: z.string().optional() }).optional(),
});

export async function POST(request) {
  try {
    await dbConnect();
    // Detect multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const f = Object.fromEntries(formData.entries());

      const roleVal = (f.role || '').toString().toLowerCase();
      payload = {
        role: ['dosen', 'mahasiswa', 'prodi', 'fakultas'].includes(roleVal) ? roleVal : 'mahasiswa',
        identitas: {
          nim: f.identitas_nim || undefined,
          nama: f.identitas_nama || undefined,
          program_studi: f.identitas_program_studi || undefined,
        },
        prestasi: {
          judul: f.judul || '',
          tingkat: f.tingkat || 'Nasional',
          penyelenggara: f.penyelenggara || f.deskripsi || '',
          tanggal: f.tanggal || '',
        },
        bukti: {},
      };

      // If the client provided fallback URLs for bukti (useful when editing without re-upload)
      if (f.bukti_url_sertifikat) payload.bukti.url_sertifikat = f.bukti_url_sertifikat;
      if (f.bukti_url_foto) payload.bukti.url_foto = f.bukti_url_foto;
      // compute upload folder for these incoming files
      const yearForFolder = payload.prestasi?.tanggal ? new Date(payload.prestasi.tanggal).getFullYear() : new Date().getFullYear();
      const uploadFolder = `prestasi/${payload.role}/${yearForFolder}`;

      // files: formData.get('bukti_sertifikat') may be a File
      const certFile = formData.get('bukti_sertifikat');
      if (certFile && typeof certFile.arrayBuffer === 'function' && certFile.size > 0) {
        // basic validation: allow pdf and common image types for certs
        const mime = certFile.type || '';
        if (!mime.includes('pdf') && !mime.startsWith('image/')) return NextResponse.json({ success: false, message: 'Tipe file sertifikat harus PDF atau gambar' }, { status: 400 });
        const buffer = Buffer.from(await certFile.arrayBuffer());
        // write to temp file
        const tmpName = `${Date.now()}_${(certFile.name || 'cert').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const tmpPath = path.join(os.tmpdir(), tmpName);
        await fs.promises.writeFile(tmpPath, buffer);
        try {
          const up = await cloudinary.uploader.upload(tmpPath, { folder: `prestasi/dokumen/${yearForFolder}`, resource_type: 'auto' });
          if (!up || !up.secure_url) return NextResponse.json({ success: false, message: 'Gagal upload sertifikat ke Cloudinary' }, { status: 500 });
          payload.bukti.url_sertifikat = up.secure_url;
        } catch (err) {
          console.error('Cloudinary upload cert error', err);
          return NextResponse.json({ success: false, message: `Gagal upload sertifikat: ${err.message || err}` }, { status: 500 });
        } finally {
          try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
        }
      }

      const photoFile = formData.get('bukti_foto');
      if (photoFile && typeof photoFile.arrayBuffer === 'function' && photoFile.size > 0) {
        const mime = photoFile.type || '';
        if (!mime.startsWith('image/')) return NextResponse.json({ success: false, message: 'Tipe file foto harus berupa gambar' }, { status: 400 });
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const tmpName = `${Date.now()}_${(photoFile.name || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const tmpPath = path.join(os.tmpdir(), tmpName);
        await fs.promises.writeFile(tmpPath, buffer);
        try {
          const up = await cloudinary.uploader.upload(tmpPath, { folder: `prestasi/foto/${yearForFolder}`, resource_type: 'auto' });
          if (!up || !up.secure_url) return NextResponse.json({ success: false, message: 'Gagal upload foto ke Cloudinary' }, { status: 500 });
          payload.bukti.url_foto = up.secure_url;
        } catch (err) {
          console.error('Cloudinary upload photo error', err);
          return NextResponse.json({ success: false, message: `Gagal upload foto: ${err.message || err}` }, { status: 500 });
        } finally {
          try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
        }
      }

      // Require at least one bukti (file upload or fallback URL) on create
      const hasAnyBukti = Boolean(payload.bukti.url_sertifikat || payload.bukti.url_foto);
      if (!hasAnyBukti) {
        return NextResponse.json({ success: false, message: 'Please provide at least one bukti file (foto or sertifikat) or a valid URL.' }, { status: 400 });
      }

    } else {
      const body = await request.json();
      const parsed = PostSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
      }
      payload = parsed.data;
    }

    const { role, prestasi } = payload;
    // determine folder by role and year (use prestasi.tanggal if provided)
    const year = prestasi?.tanggal ? new Date(prestasi.tanggal).getFullYear() : new Date().getFullYear();
    const folder = `prestasi/${role}/${year}`;

  const _id = await generateId(role, prestasi.tingkat, prestasi.tanggal);

    // Reject client-side blob: URLs (they are temporary and not uploadable from server)
    const hasBlobUrl = (url) => typeof url === 'string' && url.startsWith('blob:');
    if (payload.bukti) {
      if (hasBlobUrl(payload.bukti.url_foto) || hasBlobUrl(payload.bukti.url_sertifikat)) {
        return NextResponse.json({ success: false, message: 'Please upload files instead of sending blob URLs. Re-submit with actual File objects.' }, { status: 400 });
      }
    }

  const doc = new Prestasi({ _id, ...payload });
  await doc.save();

  return NextResponse.json({ success: true, message: 'Data berhasil disimpan', data: doc }, { status: 201 });
  } catch (err) {
    console.error('POST /api/prestasi error', err);
    // Handle duplicate id (very unlikely due to Counter upsert)
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate ID generated, please retry' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Missing id query parameter' }, { status: 400 });

    const existed = await Prestasi.findById(id);
    if (!existed) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    await Prestasi.deleteOne({ _id: id });
    return NextResponse.json({ success: true, message: 'Prestasi deleted' });
  } catch (err) {
    console.error('DELETE /api/prestasi error', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// Update existing prestasi (by _id in body)
export async function PUT(request) {
  try {
    await dbConnect();
    const contentType = request.headers.get('content-type') || '';
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) console.log('PUT /api/prestasi idFromQuery=', idFromQuery);
    let updateBody = {};
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const f = Object.fromEntries(formData.entries());

        // allow _id in query string as fallback for multipart requests
        if (!f._id && idFromQuery) f._id = idFromQuery;
        if (!f._id) return NextResponse.json({ success: false, message: 'Missing _id in form' }, { status: 400 });

        // Fetch existing doc so we can preserve bukti fields if not replaced
        console.log('PUT /api/prestasi multipart received _id=', f._id);
        const existing = await Prestasi.findById(f._id).lean();
        console.log('PUT /api/prestasi multipart existing=', !!existing);
        if (!existing) return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });

        updateBody._id = f._id;
        const roleVal = (f.role || '').toString().toLowerCase();
        updateBody.role = ['dosen', 'mahasiswa', 'prodi', 'fakultas'].includes(roleVal) ? roleVal : (existing?.role || 'mahasiswa');
        updateBody.identitas = {
          nim: f.identitas_nim || existing.identitas?.nim || undefined,
          nama: f.identitas_nama || existing.identitas?.nama || undefined,
          program_studi: f.identitas_program_studi || existing.identitas?.program_studi || undefined,
        };
        updateBody.prestasi = {
          judul: f.judul || existing.prestasi?.judul || '',
          tingkat: f.tingkat || existing.prestasi?.tingkat || 'Nasional',
          penyelenggara: f.penyelenggara || f.deskripsi || existing.prestasi?.penyelenggara || '',
          tanggal: f.tanggal || existing.prestasi?.tanggal || '',
        };

        // Start with existing bukti if present, otherwise empty object
        updateBody.bukti = existing?.bukti ? { ...existing.bukti } : {};

        // compute folder for uploads (use provided tanggal if any, otherwise existing or current year)
        const tahunForFolder = updateBody.prestasi?.tanggal ? new Date(updateBody.prestasi.tanggal).getFullYear() : existing?.prestasi?.tanggal ? new Date(existing.prestasi.tanggal).getFullYear() : new Date().getFullYear();

        // Accept fallback URL fields from form (useful when client sends the existing URLs)
        if (f.bukti_url_sertifikat) updateBody.bukti.url_sertifikat = f.bukti_url_sertifikat;
        if (f.bukti_url_foto) updateBody.bukti.url_foto = f.bukti_url_foto;

        // Handle cert replacement
        const certFile = formData.get('bukti_sertifikat');
        if (certFile && typeof certFile.arrayBuffer === 'function' && certFile.size > 0) {
          const mime = certFile.type || '';
          if (!mime.includes('pdf') && !mime.startsWith('image/')) return NextResponse.json({ success: false, message: 'Tipe file sertifikat harus PDF atau gambar' }, { status: 400 });
          const buffer = Buffer.from(await certFile.arrayBuffer());
          const tmpName = `${Date.now()}_${(certFile.name || 'cert').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const tmpPath = path.join(os.tmpdir(), tmpName);
          await fs.promises.writeFile(tmpPath, buffer);
          try {
            const up = await cloudinary.uploader.upload(tmpPath, { folder: `prestasi/dokumen/${tahunForFolder}`, resource_type: 'auto' });
            if (!up || !up.secure_url) return NextResponse.json({ success: false, message: 'Gagal upload sertifikat ke Cloudinary' }, { status: 500 });
            // delete old asset if exists
            if (updateBody.bukti.url_sertifikat) {
              const oldId = publicIdFromUrl(updateBody.bukti.url_sertifikat);
              if (oldId) await deleteCloudinaryAsset(oldId);
            }
            updateBody.bukti.url_sertifikat = up.secure_url;
          } catch (err) {
            console.error('Cloudinary upload cert error (PUT)', err);
            return NextResponse.json({ success: false, message: `Gagal upload sertifikat: ${err.message || err}` }, { status: 500 });
          } finally {
            try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
          }
        }

        // Handle photo replacement
        const photoFile = formData.get('bukti_foto');
        if (photoFile && typeof photoFile.arrayBuffer === 'function' && photoFile.size > 0) {
          const mime = photoFile.type || '';
          if (!mime.startsWith('image/')) return NextResponse.json({ success: false, message: 'Tipe file foto harus berupa gambar' }, { status: 400 });
          const buffer = Buffer.from(await photoFile.arrayBuffer());
          const tmpName = `${Date.now()}_${(photoFile.name || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const tmpPath = path.join(os.tmpdir(), tmpName);
          await fs.promises.writeFile(tmpPath, buffer);
          try {
            const up = await cloudinary.uploader.upload(tmpPath, { folder: `prestasi/foto/${tahunForFolder}`, resource_type: 'auto' });
            if (!up || !up.secure_url) return NextResponse.json({ success: false, message: 'Gagal upload foto ke Cloudinary' }, { status: 500 });
            if (updateBody.bukti.url_foto) {
              const oldId = publicIdFromUrl(updateBody.bukti.url_foto);
              if (oldId) await deleteCloudinaryAsset(oldId);
            }
            updateBody.bukti.url_foto = up.secure_url;
          } catch (err) {
            console.error('Cloudinary upload photo error (PUT)', err);
            return NextResponse.json({ success: false, message: `Gagal upload foto: ${err.message || err}` }, { status: 500 });
          } finally {
            try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
          }
        }

    } else {
      const body = await request.json();
      // fallback to query param id if body lacks _id
      if (!body._id && idFromQuery) body._id = idFromQuery;
      console.log('PUT /api/prestasi json body _id=', body._id);
      if (!body._id) return NextResponse.json({ success: false, message: 'Missing _id in body' }, { status: 400 });
      updateBody = body;
    }

    console.log('PUT /api/prestasi updating _id=', updateBody._id);
    // Attempt to match either string _id or ObjectId _id (handles older documents)
    const idQuery = [{ _id: updateBody._id }];
    if (typeof updateBody._id === 'string' && /^[0-9a-fA-F]{24}$/.test(updateBody._id)) {
      try {
        idQuery.push({ _id: mongoose.Types.ObjectId(updateBody._id) });
      } catch (e) {
        // ignore invalid ObjectId conversion
      }
    }
    const updated = await Prestasi.findOneAndUpdate({ $or: idQuery }, { $set: updateBody }, { new: true });
    console.log('PUT /api/prestasi updated=', !!updated);
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Prestasi updated', data: updated });
  } catch (err) {
    console.error('PUT /api/prestasi error', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
