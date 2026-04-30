import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    const { id } = (await params) || {};

    const client = await clientPromise;
    const db = client.db("websitefkom");

    // Support both legacy ObjectId documents and newer string _id (Mongoose)
    let query;
    try {
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        query = { _id: id };
      }
    } catch (e) {
      // fallback to string id
      query = { _id: id };
    }

    const data = await db.collection("prodi").findOne(query);

    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
