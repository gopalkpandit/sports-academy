import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    sport: { type: String, required: true, trim: true, maxlength: 40 },
    opponent: { type: String, required: true, trim: true, maxlength: 80 },
    venue: { type: String, trim: true, maxlength: 80, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'matches' }
);

matchSchema.index({ date: -1 });

export const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
export default Match;
