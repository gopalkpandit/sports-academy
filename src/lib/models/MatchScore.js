import mongoose from 'mongoose';

const matchScoreSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    date: { type: String, required: true }, // copied from the match for fast rule checks
    score: { type: Number, required: true, min: 0, max: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'matchScores' }
);

matchScoreSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
matchScoreSchema.index({ playerId: 1 });

export const MatchScore =
  mongoose.models.MatchScore || mongoose.model('MatchScore', matchScoreSchema);
export default MatchScore;
