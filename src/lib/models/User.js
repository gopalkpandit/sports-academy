import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['coach', 'player', 'scout'] },
    // Only set for role "player": links the login account to a player record.
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
