import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    date: { type: String, required: true }, // copied from the session for fast rule checks
    status: { type: String, required: true, enum: ['present', 'absent'] },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'attendance' }
);

// A player can appear only once per session.
attendanceSchema.index({ sessionId: 1, playerId: 1 }, { unique: true });
attendanceSchema.index({ playerId: 1, date: 1 });

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default Attendance;
