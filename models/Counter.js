import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. 'berita'
  seq: { type: Number, default: 0 },
});

// Use existing model if available (hot reload)
export default mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

// Helper to get next sequence (atomic)
export async function getNextSequence(name) {
  const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
  const r = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return r.seq;
}
