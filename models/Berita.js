import mongoose from 'mongoose';
import slugifyPkg from 'slugify';
import { getNextSequence } from './Counter';
import dbConnect from '@/lib/mongoose';

const slugify = (s) => slugifyPkg(String(s || ''), { lower: true, strict: true });

// Use explicit collection name 'berita' to match existing DB and avoid Mongoose pluralization to 'beritas'
const BeritaSchema = new mongoose.Schema({
  _id: { type: String }, // custom id: BRT-DDMMYY-XXX
  judul: { type: String, required: true, minlength: 5, index: true },
  isi: { type: String, required: true },
  gambarJudul: { type: String, default: null },
  kategori: { type: String, enum: ['Teknologi', 'Pendidikan', 'Event', 'Umum'], default: 'Umum', index: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  penulis: { type: String, default: 'Admin' },
  tags: { type: [String], default: [] },
  slug: { type: String, index: true, unique: true },
  views: { type: Number, default: 0 },
}, { timestamps: true, collection: 'berita' });

// Pre-save hook: generate custom _id and slug
BeritaSchema.pre('save', async function (next) {
  try {
    // connect if needed
    await dbConnect();

    // generate slug if not provided or if title changed
    if (!this.slug || this.isModified('judul')) {
      // base slug
      let base = slugify(this.judul || this.slug || String(Date.now()));
      // ensure uniqueness by appending suffix if needed
      let candidate = base;
      let i = 0;
      // lookup directly in the collection
      // eslint-disable-next-line no-underscore-dangle
      while (await mongoose.models.Berita && await mongoose.models.Berita.exists({ slug: candidate, _id: { $ne: this._id } })) {
        i += 1;
        candidate = `${base}-${i}`;
        if (i > 1000) break;
      }
      this.slug = candidate;
    }

    // generate custom _id if not present
    if (!this._id) {
      // sequence number from Counter
      const seq = await getNextSequence('berita');
      // format date DDMMYY
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const datePart = `${dd}${mm}${yy}`;
      const num = String(seq).padStart(3, '0');
      this._id = `BRT-${datePart}-${num}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// text index for searching
BeritaSchema.index({ judul: 'text', isi: 'text' });

export default mongoose.models.Berita || mongoose.model('Berita', BeritaSchema);
