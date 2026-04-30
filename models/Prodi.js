import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Helper: generate short abbreviation (1-3 chars) from program name
 * Examples:
 *  - "Sistem Informasi" -> "SI"
 *  - "Teknik Informatika" -> "TI"
 *  - "Bisnis Digital" -> "BD"
 */
function generateAbbreviation(name) {
  if (!name || typeof name !== 'string') return 'PG';
  // remove punctuation and parentheses
  const cleaned = name.replace(/[()\[\]{}.,:/\\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 0) return 'PG';

  // Prefer using initials of up to 3 words
  const initials = words.map((w) => w[0].toUpperCase()).join('');
  if (initials.length >= 2) return initials.slice(0, 3);

  // Fallback: take first up to 3 letters of the single word
  return words[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
}

/**
 * Ensure a unique custom _id for Prodi documents.
 * Base format: PGS-FKOM-<ABBR>
 * If collision detected, append -1, -2, ...
 */
async function buildUniqueProdiId(Model, name) {
  const abbr = generateAbbreviation(name);
  const base = `PGS-FKOM-${abbr}`;
  let candidate = base;
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // check existence
    // Use lean existence check to avoid overhead
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists({ _id: candidate });
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
    if (i > 9999) throw new Error('Unable to generate unique Prodi ID');
  }
}

const ProdiSchema = new mongoose.Schema(
  {
    _id: { type: String }, // custom id: PGS-FKOM-XX
    nama: { type: String, required: true, minlength: 5, index: true },
    deskripsi: { type: String, required: true },
    gambar: { type: String, default: null },
    visi: { type: String, default: null },
    misi: { type: [String], default: [] },
    akreditasi: {
      type: String,
      enum: ['Unggul', 'Baik Sekali', 'Baik', 'Cukup', 'Kurang', 'Tidak Terakreditasi', ''],
      default: '',
      index: true,
    },
    tahun_akreditasi: { type: String, default: null },

    // Dokumen akreditasi fields
    dokumenAkreditasi: { type: String, default: null }, // URL to PDF or image
    thumbnailAkreditasi: { type: String, default: null }, // optional preview image URL
  },
  {
    timestamps: true,
    collection: 'prodi', // keep collection name stable
  }
);

// Indexes to support search
ProdiSchema.index({ nama: 'text', akreditasi: 1 });

// Pre-save: generate custom _id and attempt thumbnail creation for PDF dokumenAkreditasi
ProdiSchema.pre('save', async function preSave(next) {
  try {
    // Ensure DB connection (no-op if already connected)
    await dbConnect();

    const Model = mongoose.models.Prodi || mongoose.model('Prodi', ProdiSchema);

    // Generate custom _id when creating a new doc
    if (!this._id) {
      // Build unique id based on name abbreviation
      // eslint-disable-next-line no-await-in-loop
      this._id = await buildUniqueProdiId(Model, this.nama || String(Date.now()));
    }

    // If dokumenAkreditasi is a PDF and no thumbnail provided, try to generate via Cloudinary
    if (
      this.dokumenAkreditasi &&
      typeof this.dokumenAkreditasi === 'string' &&
      this.dokumenAkreditasi.toLowerCase().endsWith('.pdf') &&
      !this.thumbnailAkreditasi &&
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        // Cloudinary can fetch remote PDF and generate an image of the first page.
        // We request format png and set page to 1.
        // If remote fetch is blocked or fails, we silently ignore and leave thumbnail null.
        // eslint-disable-next-line no-await-in-loop
        const uploadResult = await cloudinary.uploader.upload(this.dokumenAkreditasi, {
          resource_type: 'image',
          format: 'png',
          transformation: [{ page: 1, width: 1200, crop: 'limit' }],
        });
        if (uploadResult && uploadResult.secure_url) {
          this.thumbnailAkreditasi = uploadResult.secure_url;
        }
      } catch (err) {
        // Do not block saving if thumbnail generation fails
        // console.warn('Prodi thumbnail generation failed:', err.message);
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

export default mongoose.models.Prodi || mongoose.model('Prodi', ProdiSchema);
