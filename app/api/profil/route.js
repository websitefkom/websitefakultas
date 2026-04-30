import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  const client = await clientPromise;
  const db = client.db("websitefkom");
  const data = await db.collection("profil").findOne({});
  return new Response(JSON.stringify(data || { visi: "", misi: [], tujuan: [] }), {
    status: 200,
  });
}

export async function PUT(req) {
  const client = await clientPromise;
  const db = client.db("websitefkom");

  const body = await req.json();
  const { visi, misi, tujuan } = body;

  await db.collection("profil").updateOne(
    {},
    { $set: { visi, misi, tujuan } },
    { upsert: true }
  );

  return new Response(JSON.stringify({ message: "Profil diperbarui" }), { status: 200 });
}
