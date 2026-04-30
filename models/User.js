import mongoose from 'mongoose'
import dbConnect from '@/lib/mongoose'
import { getNextSequence } from './Counter'

const UserSchema = new mongoose.Schema({
  _id: { type: String }, // will be USR-001, USR-002...
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: null },
  role: { type: String, enum: ['super_admin', 'dekan', 'ketua_dept', 'kepala_dept', 'sekretaris'], default: 'sekretaris', index: true },
  unitKerja: { type: String, required: function () { return ['ketua_dept', 'kepala_dept', 'sekretaris'].includes(this.role) }, default: null },
}, { timestamps: true, collection: 'users' })

// Pre-save: generate human-friendly _id if not provided
UserSchema.pre('save', async function (next) {
  try {
    await dbConnect()
    if (!this._id) {
      const seq = await getNextSequence('user')
      this._id = `USR-${String(seq).padStart(3, '0')}`
    }
    next()
  } catch (err) {
    next(err)
  }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
