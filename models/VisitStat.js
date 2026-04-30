import mongoose from 'mongoose'

const VisitStatSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  count: { type: Number, default: 0 },
})

export default mongoose.models.VisitStat || mongoose.model('VisitStat', VisitStatSchema)
