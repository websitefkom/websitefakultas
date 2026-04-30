import mongoose from 'mongoose';

const MitraSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  logo: { type: String, default: null },
  link: { type: String, default: '' },
  urutan: { type: Number, default: 0 },
  aktif: { type: Boolean, default: true },
}, { timestamps: true, collection: 'mitra' });

export default mongoose.models.Mitra || mongoose.model('Mitra', MitraSchema);
