import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET(req) {
  // Attempt to connect to DB — if it fails, return empty list so UI stays functional
  try {
    await dbConnect()
  } catch (err) {
    console.error('GET /api/users - dbConnect failed:', err.message || err)
    // Return empty array with 200 so client does not treat as fatal
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const users = await User.find().select('-password').lean()
    return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('GET /api/users error', err)
    return new Response(JSON.stringify({ error: 'Gagal mengambil pengguna' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password, role } = body
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    await dbConnect()
    const existing = await User.findOne({ email })
    if (existing) return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } })
    const hashed = await bcrypt.hash(password, 10)
    const u = new User({ name, email, password: hashed, role })
    await u.save()
    const out = u.toObject()
    delete out.password
    return new Response(JSON.stringify(out), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('POST /api/users error', err)
    return new Response(JSON.stringify({ error: 'Gagal membuat pengguna' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function PUT(req) {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    const body = await req.json()
    await dbConnect()
    const update = { name: body.name, email: body.email, role: body.role }
    if (body.password) update.password = await bcrypt.hash(body.password, 10)
    const user = await User.findOneAndUpdate({ _id: id }, update, { new: true })
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    const out = user.toObject()
    delete out.password
    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('PUT /api/users error', err)
    return new Response(JSON.stringify({ error: 'Gagal memperbarui pengguna' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    await dbConnect()
    const res = await User.deleteOne({ _id: id })
    if (res.deletedCount === 0) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('DELETE /api/users error', err)
    return new Response(JSON.stringify({ error: 'Gagal menghapus pengguna' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
