import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// ================== POST ==================
export async function POST(req, context) {
  const params = await context.params;   // ✅ params harus di-await
  const { section } = params;
  let data = await req.json();

  // kalau data string (misal ketentuan), bungkus biar rapih
  if (typeof data === "string") {
    data = { value: data };
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "websitefkom");

    // Update atau insert section tertentu
    await db.collection("peraturan").updateOne(
      { section }, // filter berdasarkan section
      { $set: { ...data, updatedAt: new Date() } }, // update isi
      { upsert: true } // kalau belum ada, insert baru
    );

    return NextResponse.json({ success: true, section, data });
  } catch (err) {
    console.error("DB Error (POST):", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
