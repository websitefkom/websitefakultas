import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadToCloudinary, deleteCloudinaryAsset } from "@/lib/cloudinary";

// === GET: Ambil semua dokumen ===
export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    // Ambil data dokumen berdasarkan _id
    const data = await db
      .collection("peraturan")
      .findOne({ _id: "peraturanList" });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Data dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hanya return field dokumen saja biar clean
    const url = new URL(req.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    const docs = (data.dokumen || []);
    if (includeDeleted) {
      return NextResponse.json({ success: true, dokumen: docs });
    }
    // Filter out soft-deleted dokumen by default
    const visible = docs.filter(d => !d.deletedAt);
    return NextResponse.json({ success: true, dokumen: visible });
  } catch (err) {
    console.error("DB Error (GET Dokumen):", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// === DELETE: Hapus dokumen (MongoDB + Cloudinary) ===
export async function DELETE(req) {
  try {
    const { fileId, force } = await req.json();
    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "fileId tidak ada" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    // If force=true, permanently remove file doc and dokumen entry
    if (force) {
      // try to delete cloudinary asset if present
      try {
        const fileDoc = await db.collection('peraturan_files').findOne({ _id: new ObjectId(fileId) });
        if (fileDoc?.cloudinaryId) {
          await deleteCloudinaryAsset(fileDoc.cloudinaryId);
        }
      } catch (e) {
        console.warn('Failed to delete cloudinary asset during purge:', fileId, e?.message);
      }

      try {
        await db.collection('peraturan_files').deleteOne({ _id: new ObjectId(fileId) });
      } catch (e) {
        console.warn('Failed to delete peraturan_files doc during purge:', fileId, e?.message);
      }

      await db.collection('peraturan').updateOne(
        { _id: 'peraturanList' },
        { $pull: { dokumen: { fileId } } }
      );

      return NextResponse.json({ success: true, message: 'Dokumen permanen dihapus' });
    }

    // Soft-delete: set deletedAt timestamp on the dokumen
    const peraturan = await db.collection('peraturan').findOne({ _id: 'peraturanList' });
    if (!peraturan) {
      return NextResponse.json({ success: false, message: 'Data peraturan tidak ditemukan' }, { status: 404 });
    }

    const idx = (peraturan.dokumen || []).findIndex(d => d.fileId === fileId);
    if (idx === -1) {
      return NextResponse.json({ success: false, message: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    peraturan.dokumen[idx].deletedAt = new Date().toISOString();

    await db.collection('peraturan').updateOne({ _id: 'peraturanList' }, { $set: { dokumen: peraturan.dokumen } });

    return NextResponse.json({ success: true, message: 'Dokumen diberi tanda terhapus (soft-delete)' });
  } catch (err) {
    console.error('Delete Dokumen Error:', err);
    return NextResponse.json({ success: false, message: 'Gagal hapus dokumen' }, { status: 500 });
  }
}

// === PATCH: Edit dokumen ===

export async function PATCH(req) {
  try {
    const formData = await req.formData(); // use req.formData()
    const fileId = formData.get("fileId");
    const name = formData.get("name");
    const file = formData.get("file"); // can be null

    if (!fileId || !name) {
      return NextResponse.json(
        { success: false, message: "fileId atau nama dokumen tidak ada" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    // Get peraturan list
    const peraturan = await db.collection("peraturan").findOne({ _id: "peraturanList" });
    if (!peraturan) {
      return NextResponse.json({ success: false, message: "Data dokumen tidak ditemukan" }, { status: 404 });
    }

    const docIndex = (peraturan.dokumen || []).findIndex(d => d.fileId === fileId);
    if (docIndex === -1) {
      return NextResponse.json({ success: false, message: "Dokumen tidak ditemukan di DB" }, { status: 404 });
    }

    let updatedDoc = { ...peraturan.dokumen[docIndex], dokumenName: name };

    // If a new file is provided, upload to Cloudinary and replace the reference
    if (file && file.size > 0) {
      const sanitize = (s = "") => s.replace(/[^a-z0-9\-_.]/gi, '_').substring(0, 200);
      const publicId = sanitize(name || `peraturan_${Date.now()}`);
      const mime = file.type || '';
      const uploadOptions = { public_id: publicId };
      if (mime.includes('pdf') || mime.includes('msword') || mime.includes('officedocument')) {
        uploadOptions.resource_type = 'raw';
      }
      const uploadRes = await uploadToCloudinary(file, 'peraturan', uploadOptions);
      if (!uploadRes.success) throw new Error(uploadRes.message || 'Cloudinary upload failed');

      const url = uploadRes.url;
      const public_id = uploadRes.public_id || null;

      const bytes = file && typeof file.arrayBuffer === 'function' ? Buffer.from(await file.arrayBuffer()) : null;
      const size = bytes ? bytes.length : updatedDoc.size || 0;

      // insert metadata
      const fileDoc = {
        filename: name || "file",
        cloudinaryUrl: url,
        cloudinaryId: public_id,
        public_id: public_id,
        mimeType: file.type || "application/octet-stream",
        size,
        uploadedAt: new Date(),
      };
      const insertRes = await db.collection('peraturan_files').insertOne(fileDoc);
      const newFileId = insertRes.insertedId.toString();

      // Read back inserted metadata to ensure cloudinary fields are captured
      const insertedFileDoc = await db.collection('peraturan_files').findOne({ _id: insertRes.insertedId });
      const savedCloudinaryUrl = insertedFileDoc?.cloudinaryUrl || url;
      const savedPublicId = insertedFileDoc?.cloudinaryId || public_id || null;
      const savedMime = insertedFileDoc?.mimeType || file.type || "application/octet-stream";

      // try to delete previous cloudinary asset if exists
      try {
        const oldFileDoc = updatedDoc.fileId ? await db.collection('peraturan_files').findOne({ _id: new ObjectId(updatedDoc.fileId) }) : null;
        const oldPublicId = oldFileDoc?.cloudinaryId || oldFileDoc?.public_id;
        if (oldPublicId) {
          await deleteCloudinaryAsset(oldPublicId);
        }
        // delete old fileDoc record
        if (updatedDoc.fileId) {
          await db.collection('peraturan_files').deleteOne({ _id: new ObjectId(updatedDoc.fileId) });
        }
      } catch (e) {
        console.warn('Failed to cleanup old file on replace:', e?.message);
      }

      updatedDoc.fileId = newFileId;
      // use our server endpoint for stable access/preview
      updatedDoc.url = `/api/akademik/peraturan/dokumen/file/${newFileId}`;
      updatedDoc.size = size;
      updatedDoc.uploadedAt = new Date();
      // add cloudinary metadata to dokumen entry
      updatedDoc.cloudinaryUrl = savedCloudinaryUrl;
      updatedDoc.public_id = savedPublicId;
      updatedDoc.mimeType = savedMime;
    }

    // If there's an existing fileId but dokumen lacks cloudinary metadata, try to populate it
    if (updatedDoc.fileId && !updatedDoc.cloudinaryUrl) {
      try {
        const existingFileDoc = await db.collection('peraturan_files').findOne({ _id: new ObjectId(updatedDoc.fileId) });
        if (existingFileDoc) {
          updatedDoc.cloudinaryUrl = existingFileDoc.cloudinaryUrl || updatedDoc.cloudinaryUrl;
          updatedDoc.public_id = existingFileDoc.cloudinaryId || existingFileDoc.public_id || updatedDoc.public_id;
          updatedDoc.mimeType = existingFileDoc.mimeType || updatedDoc.mimeType;
        }
      } catch (e) {
        // ignore
      }
    }

    // Update dokumen in array
    peraturan.dokumen[docIndex] = updatedDoc;

    // Save to DB
    await db.collection("peraturan").updateOne(
      { _id: "peraturanList" },
      { $set: { dokumen: peraturan.dokumen } }
    );

    return NextResponse.json({ success: true, message: "Dokumen berhasil diperbarui", dokumen: updatedDoc });
  } catch (err) {
    console.error("Patch Dokumen Error:", err);
    return NextResponse.json({ success: false, message: "Gagal update dokumen" }, { status: 500 });
  }
}