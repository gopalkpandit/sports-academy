import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    sport: { type: String, required: true, trim: true, maxlength: 40 },
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open' },
    closedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'sessions' }
);

// One practice session per sport per day.
sessionSchema.index({ date: 1, sport: 1 }, { unique: true });
sessionSchema.index({ date: -1 });

export const PracticeSession =
  mongoose.models.PracticeSession || mongoose.model('PracticeSession', sessionSchema);
export default PracticeSession;
