import mongoose from 'mongoose';

const PrestasiSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  role: { type: String, required: true, enum: ['mahasiswa', 'dosen', 'prodi', 'fakultas'] },
  identitas: {
    nim: { type: String },
    nama: { type: String },
    program_studi: { type: String },
  },
  prestasi: {
    judul: { type: String, required: true },
    tingkat: { type: String, required: true, enum: ['Nasional', 'Universitas', 'Internasional', 'Provinsi'] },
    penyelenggara: { type: String },
    tanggal: { type: String, required: true }, // ISO date YYYY-MM-DD
  },
  bukti: {
    url_sertifikat: { type: String },
    url_foto: { type: String },
  },
  created_at: { type: Date, default: () => new Date() },
});

// Ensure model is re-registered during hot-reload so schema changes (enum) apply
if (mongoose.models && mongoose.models.Prestasi) {
  try { delete mongoose.models.Prestasi } catch (e) { /* ignore */ }
}
export default mongoose.models.Prestasi || mongoose.model('Prestasi', PrestasiSchema);
