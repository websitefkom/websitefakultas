import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID diperlukan" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "websitefkom");

        const doc = await db.collection("akreditasi").findOne({
            _id: new ObjectId(id),
        });

        if (!doc) {
            return NextResponse.json(
                { success: false, message: "Dokumen tidak ditemukan" },
                { status: 404 }
            );
        }

        // Ambil stream PDF dari Cloudinary
        const cloudinaryUrl = doc.dokumenUrl;
        const res = await fetch(cloudinaryUrl);

        if (!res.ok) {
            throw new Error("Gagal mengambil file dari Cloudinary");
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${encodeURIComponent(
                    doc.dokumenName || "document.pdf"
                )}"`,
            },
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
