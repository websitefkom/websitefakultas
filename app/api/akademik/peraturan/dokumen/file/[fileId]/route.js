import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    let { fileId } = params || {};

    // Fallback: try query string or last path segment if params not populated (dev server quirks)
    if (!fileId) {
      try {
        const url = new URL(req.url);
        fileId = url.searchParams.get('fileId') || url.pathname.split('/').filter(Boolean).pop();
      } catch (e) {
        // ignore
      }
    }

    if (!fileId) {
      return NextResponse.json({ success: false, message: "fileId tidak ada" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    const fileDoc = await db.collection("peraturan_files").findOne({ _id: new ObjectId(fileId) });
    if (!fileDoc) {
      return NextResponse.json({ success: false, message: "File tidak ditemukan" }, { status: 404 });
    }

    // If this file has a Cloudinary URL, proxy the asset so external viewers (Google) can fetch it
    if (fileDoc.cloudinaryUrl) {
      try {
        const range = req.headers.get('range');
        const fetchOpts = { headers: {} };
        if (range) fetchOpts.headers.Range = range;

        const upstream = await fetch(fileDoc.cloudinaryUrl, fetchOpts);
        if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);

        // Read body as arrayBuffer
        const arrayBuffer = await upstream.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Build response headers, preserve upstream content-range if present
        const contentType = upstream.headers.get('content-type') || fileDoc.mimeType || 'application/octet-stream';
        const contentLength = String(buffer.length);
        const filename = fileDoc.filename || fileDoc.dokumenName || 'file';

        const headers = {
          'Content-Type': contentType,
          'Content-Length': contentLength,
          'Content-Disposition': `inline; filename="${filename}"`,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        };

        const upstreamContentRange = upstream.headers.get('content-range');
        if (upstreamContentRange) headers['Content-Range'] = upstreamContentRange;

        // If upstream returned partial content, mirror its status code (206)
        const status = upstream.status === 206 ? 206 : 200;

        return new NextResponse(buffer, { status, headers });
      } catch (e) {
        console.warn('Failed to proxy cloudinary asset, falling back to DB:', e?.message);
        // continue to fallback to DB serve
      }
    }

    // Fallback: serve binary stored in MongoDB
    const data = fileDoc.data;
    const body = data && data.buffer ? data.buffer : data;

    const headers = {
      "Content-Type": fileDoc.mimeType || "application/octet-stream",
      "Content-Length": String(fileDoc.size || (body ? body.length : 0)),
      "Content-Disposition": `inline; filename="${fileDoc.filename || "file"}"`,
    };

    return new NextResponse(body, { status: 200, headers });
  } catch (err) {
    console.error("GET file error:", err);
    return NextResponse.json({ success: false, message: "Gagal mengambil file" }, { status: 500 });
  }
}
