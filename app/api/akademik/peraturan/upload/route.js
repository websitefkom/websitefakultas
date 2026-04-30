// /api/akademik/peraturan/upload/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Upload file to Cloudinary, save metadata to peraturan_files, and add dokumen entry
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const name = formData.get("name");

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // upload to cloudinary using helper
    // use dokumen name as public_id (sanitized) so URL ends with readable name
    const sanitize = (s = "") => s.replace(/[^a-z0-9\-_.]/gi, '_').substring(0, 200);
    const publicId = sanitize(name || `peraturan_${Date.now()}`);

    // prefer raw resource type for PDFs/DOC/DOCX so viewers can preview correctly
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
    const size = bytes ? bytes.length : 0;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    // insert metadata into peraturan_files for tracking
    const fileDoc = {
      filename: name || "file",
      cloudinaryUrl: url,
      cloudinaryId: public_id,
      public_id: public_id,
      mimeType: file.type || "application/octet-stream",
      size,
      uploadedAt: new Date(),
    };

    const res = await db.collection("peraturan_files").insertOne(fileDoc);
    const fileId = res.insertedId.toString();

    // Read back inserted metadata to ensure we capture Cloudinary fields
    const insertedFileDoc = await db.collection("peraturan_files").findOne({ _id: res.insertedId });
    const savedCloudinaryUrl = insertedFileDoc?.cloudinaryUrl || url;
    const savedPublicId = insertedFileDoc?.cloudinaryId || public_id || null;
    const savedMime = insertedFileDoc?.mimeType || file.type || "application/octet-stream";

    // create dokumen entry referencing fileId and include Cloudinary metadata
    const docData = {
      dokumenName: name || (file && file.name) || "file",
      fileId,
      // server endpoint to access/proxy the file (used by viewer)
      url: `/api/akademik/peraturan/dokumen/file/${fileId}`,
      // keep cloudinary details for inspection or direct links if needed
      cloudinaryUrl: savedCloudinaryUrl,
      public_id: savedPublicId,
      mimeType: savedMime,
      uploadedAt: new Date(),
      size,
    };

    // push to peraturanList.dokumen
    await db.collection("peraturan").updateOne(
      { _id: "peraturanList" },
      { $push: { dokumen: docData } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: docData });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Upload failed" }, { status: 500 });
  }
}
