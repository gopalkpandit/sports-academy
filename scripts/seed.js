/**
 * Seed the academy with demo data that matches the example table in the
 * project guide.
 *
 *   npm run seed
 *
 * Requires MONGODB_URI in .env (or in the environment).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db.js';
import User from '../src/lib/models/User.js';
import Player from '../src/lib/models/Player.js';
import PracticeSession from '../src/lib/models/PracticeSession.js';
import Attendance from '../src/lib/models/Attendance.js';
import Match from '../src/lib/models/Match.js';
import MatchScore from '../src/lib/models/MatchScore.js';

const PASSWORD = 'password123';

/** YYYY-MM-DD for `daysAgo` days before today, in IST. */
function isoDaysAgo(daysAgo) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - daysAgo);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

async function main() {
  await connectDB();
  console.log('Connected. Clearing existing demo data…');

  await Promise.all([
    User.deleteMany({}),
    Player.deleteMany({}),
    PracticeSession.deleteMany({}),
    Attendance.deleteMany({}),
    Match.deleteMany({}),
    MatchScore.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  /* ---------- players ---------- */
  const players = await Player.insertMany([
    { name: 'Rahul Kumar', age: 16, sport: 'Cricket', guardianContact: '9800000001' },
    { name: 'Amit Singh', age: 15, sport: 'Cricket', guardianContact: '9800000002' },
    { name: 'Rohit Das', age: 17, sport: 'Cricket', guardianContact: '9800000003' },
    { name: 'Sumit Murmu', age: 16, sport: 'Football', guardianContact: '9800000004' },
  ]);

  const [rahul, amit, rohit, sumit] = players;

  /* ---------- logins ---------- */
  await User.insertMany([
    { name: 'Coach (Dumka Academy)', email: 'coach@academy.in', passwordHash, role: 'coach' },
    { name: 'Scout (District Trials)', email: 'scout@academy.in', passwordHash, role: 'scout' },
    { name: 'Rahul Kumar', email: 'rahul@academy.in', passwordHash, role: 'player', playerId: rahul._id },
    { name: 'Amit Singh', email: 'amit@academy.in', passwordHash, role: 'player', playerId: amit._id },
  ]);

  /* ---------- 20 practice sessions (all closed) ---------- */
  const sessionDocs = [];
  for (let index = 20; index >= 1; index -= 1) {
    sessionDocs.push({
      date: isoDaysAgo(index),
      sport: 'Cricket',
      status: 'closed',
      closedAt: new Date(),
    });
  }
  const sessions = await PracticeSession.insertMany(sessionDocs);

  /*
   * Attendance targets from the guide's example table:
   *   Rahul 90% (18/20) · Amit 60% (12/20) · Rohit 75% (15/20) · Sumit 85% (17/20)
   * The last three sessions are match days, so every player is present there.
   */
  const targets = [
    { player: rahul, present: 18 },
    { player: amit, present: 12 },
    { player: rohit, present: 15 },
    { player: sumit, present: 17 },
  ];

  const attendanceDocs = [];
  const matchSessionIndexes = [17, 18, 19]; // last three sessions are match days

  for (const { player, present: target } of targets) {
    const playerId = player._id;
    const remainingNeeded = target - matchSessionIndexes.length; // 3 forced presents
    let remainingAssigned = 0;

    sessions.forEach((session, index) => {
      const isMatchDay = matchSessionIndexes.includes(index);
      let present = false;

      if (isMatchDay) {
        present = true;
      } else if (remainingAssigned < remainingNeeded) {
        present = true;
        remainingAssigned += 1;
      }

      attendanceDocs.push({
        sessionId: session._id,
        playerId,
        date: session.date,
        status: present ? 'present' : 'absent',
      });
    });
  }

  await Attendance.insertMany(attendanceDocs);

  /* ---------- matches on the last three session dates ---------- */
  const matchDates = matchSessionIndexes.map((index) => sessions[index].date);

  const matches = await Match.insertMany([
    { date: matchDates[0], sport: 'Cricket', opponent: 'Dumka XI', venue: 'District Ground' },
    { date: matchDates[1], sport: 'Cricket', opponent: 'Sahibganj Warriors', venue: 'District Ground' },
    { date: matchDates[2], sport: 'Cricket', opponent: 'Deoghar Stars', venue: 'Dumka Stadium' },
  ]);

  const scoreRows = [
    // Match 1 — all four players took part (Sumit's only match).
    { matchId: matches[0]._id, playerId: rahul._id, date: matches[0].date, score: 78 },
    { matchId: matches[0]._id, playerId: amit._id, date: matches[0].date, score: 55 },
    { matchId: matches[0]._id, playerId: rohit._id, date: matches[0].date, score: 70 },
    { matchId: matches[0]._id, playerId: sumit._id, date: matches[0].date, score: 61 },
    // Match 2 — Rahul, Amit, Rohit.
    { matchId: matches[1]._id, playerId: rahul._id, date: matches[1].date, score: 85 },
    { matchId: matches[1]._id, playerId: amit._id, date: matches[1].date, score: 60 },
    { matchId: matches[1]._id, playerId: rohit._id, date: matches[1].date, score: 74 },
    // Match 3 — Rahul and Amit only.
    { matchId: matches[2]._id, playerId: rahul._id, date: matches[2].date, score: 92 },
    { matchId: matches[2]._id, playerId: amit._id, date: matches[2].date, score: 58 },
  ];

  await MatchScore.insertMany(scoreRows);

  console.log('\nSeed complete.');
  console.log('  Players: 4 · Sessions: 20 · Matches: 3 · Attendance rows:', attendanceDocs.length);
  console.log('\nLogins (password for all: %s)', PASSWORD);
  console.log('  coach@academy.in  → Coach dashboard');
  console.log('  scout@academy.in  → Scout dashboard (Ready players only)');
  console.log('  rahul@academy.in  → Player dashboard (Ready: 90%%, 3 matches)');
  console.log('  amit@academy.in   → Player dashboard (Not Ready: 60%%)');
  console.log('\nExpected Ready status: Rahul Ready · Amit Not Ready · Rohit Ready · Sumit Not Ready');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
