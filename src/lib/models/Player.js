import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 5, max: 90 },
    sport: { type: String, required: true, trim: true, maxlength: 40 },
    guardianContact: { type: String, trim: true, maxlength: 40, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'players' }
);

playerSchema.index({ name: 1 });

export const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);
export default Player;
