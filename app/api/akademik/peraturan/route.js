import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("websitefkom");

    const docs = await db.collection("peraturan").find({}).toArray();

    const result = {};
    docs.forEach((doc) => {
      result[doc.section] = doc.value || null;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("DB Error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
