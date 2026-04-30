import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { getNextSequence } from '@/models/Counter'

async function seedSuperAdmin(body = {}) {
  await dbConnect()

  const email = body.email || process.env.SEED_ADMIN_EMAIL || 'admin@fkom.local'
  const password = body.password || process.env.SEED_ADMIN_PASSWORD || 'Admin123!'
  const name = body.name || 'Super Admin'

  // if a super_admin already exists, return it (do not create duplicates)
  const existing = await User.findOne({ role: 'super_admin' }).lean()
  if (existing) {
    const { password: _pw, ...safe } = existing
    return { status: 200, body: { ok: true, message: 'Super admin already exists', user: safe } }
  }

  // prepare id sequence
  const seq = await getNextSequence('user')
  const id = `USR-${String(seq).padStart(3, '0')}`

  const hash = await bcrypt.hash(password, 10)

  const user = new User({ _id: id, email, password: hash, name, role: 'super_admin', image: null })
  await user.save()

  const { password: _pw, ...safe } = user.toObject()
  return { status: 201, body: { ok: true, message: 'Super admin created', user: safe } }
}
// Create multiple default users (dummy accounts) when requested
async function seedMultipleDefaults() {
  await dbConnect()

  const defaults = [
    { role: 'super_admin', email: process.env.SEED_ADMIN_EMAIL || 'admin@fkom.local', name: 'Super Admin', password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!' },
    { role: 'dekan', email: 'dekan@fkom.local', name: 'Dekan Fakultas', password: 'Dekan123!' },
    { role: 'ketua_dept', email: 'ketua@fkom.local', name: 'Ketua Dept. TI', password: 'Ketua123!', unitKerja: 'S1 Teknik Informatika' },
    { role: 'sekretaris', email: 'sekretaris@fkom.local', name: 'Sekretaris Fakultas', password: 'Sekretaris123!', unitKerja: 'Fakultas Komputer' },
  ]

  const created = []
  const skipped = []

  for (const u of defaults) {
    const exists = await User.findOne({ email: u.email }).lean()
    if (exists) {
      skipped.push({ email: u.email, reason: 'already exists' })
      continue
    }

    const seq = await getNextSequence('user')
    const id = `USR-${String(seq).padStart(3, '0')}`
    const hash = await bcrypt.hash(u.password, 10)
    const doc = new User({ _id: id, email: u.email, password: hash, name: u.name, role: u.role, image: null, unitKerja: u.unitKerja || null })
    await doc.save()
    const { password: _pw, ...safe } = doc.toObject()
    created.push(safe)
  }

  return { status: 201, body: { ok: true, created, skipped } }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    // if client requests multiple default accounts, run that
    if (body.multiple) {
      const res = await seedMultipleDefaults()
      return new Response(JSON.stringify(res.body), { status: res.status })
    }
    // else create a single super_admin (backwards compatible)
    const res = await seedSuperAdmin(body)
    return new Response(JSON.stringify(res.body), { status: res.status })
  } catch (err) {
    console.error('Seeder error', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

export async function GET() {
  try {
    // by default, create multiple dummy accounts for convenience
    const res = await seedMultipleDefaults()
    return new Response(JSON.stringify(res.body), { status: res.status })
  } catch (err) {
    console.error('Seeder GET error', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
