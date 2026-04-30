import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET semua anggota
export async function GET() {
  const client = await clientPromise;
  const db = client.db("websitefkom");
  const anggota = await db.collection("strukturorganisasi").find({}).toArray();
  return new Response(JSON.stringify(anggota), { status: 200 });
}

// POST tambah anggota
export async function POST(req) {
  try {
    const formData = await req.formData();
    const nama = formData.get("nama");
    const jabatan = formData.get("jabatan");
    const email = formData.get("email");
    const file = formData.get("foto");

    let fotoUrl = "";
    if (file && typeof file.arrayBuffer === "function") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "strukturorganisasi" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      fotoUrl = uploadRes.secure_url;
    }

    const client = await clientPromise;
    const db = client.db("websitefkom");

    const result = await db.collection("strukturorganisasi").insertOne({
      nama,
      jabatan,
      email,
      foto: fotoUrl,
    });

    return new Response(
      JSON.stringify({ _id: result.insertedId, nama, jabatan, email, foto: fotoUrl }),
      { status: 201 }
    );
  } catch (err) {
    console.error("POST anggota gagal:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Edit anggota 
export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();
    const nama = formData.get("nama");
    const jabatan = formData.get("jabatan");
    const email = formData.get("email");
    const file = formData.get("foto");

    let updateData = { nama, jabatan, email };

    if (file && typeof file.arrayBuffer === "function") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
    
      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "strukturorganisasi" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });
    
      updateData.foto = uploadRes.secure_url;
    }    

    const client = await clientPromise;
    const db = client.db("websitefkom");

    await db.collection("strukturorganisasi").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Return data terbaru
    const updated = await db.collection("strukturorganisasi").findOne({ _id: new ObjectId(id) });
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE anggota
export async function DELETE(req, context) {
  try {
    const { id } = await context.params; // params harus di-await
    const client = await clientPromise;
    const db = client.db("websitefkom");
    await db.collection("strukturorganisasi").deleteOne({ _id: new ObjectId(id) });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}