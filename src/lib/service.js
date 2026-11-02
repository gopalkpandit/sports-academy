/**
 * Data access + business rules glue.
 *
 * Pages and API routes both call these functions, so a rule can never be
 * enforced in one place and forgotten in another. Every write validates first.
 */
import { connectDB } from './db.js';
import Player from './models/Player.js';
import User from './models/User.js';
import PracticeSession from './models/PracticeSession.js';
import Attendance from './models/Attendance.js';
import Match from './models/Match.js';
import MatchScore from './models/MatchScore.js';
import {
  evaluateAllPlayers,
  evaluatePlayer,
  canEditAttendance,
  validateAttendanceMarks,
  validateMatchEntry,
  parseScore,
  isISODate,
} from './core.js';
import { badRequest, notFound } from './http.js';
import mongoose from 'mongoose';

const key = (value) => (value === null || value === undefined ? '' : String(value));

/**
 * A malformed id would otherwise reach Mongo and blow up as a CastError (500).
 * Catch it here and answer 400 with a readable message instead.
 */
function ensureObjectId(value, label = 'id') {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw badRequest(`That ${label} is not valid.`, 'INVALID_ID');
  }
  return value;
}

/** Load the whole academy in one shot. Small academy, so this is cheap. */
export async function loadAcademy() {
  await connectDB();
  const [players, sessions, attendance, matches, matchScores] = await Promise.all([
    Player.find({ active: true }).sort({ name: 1 }).lean(),
    PracticeSession.find().sort({ date: -1, sport: 1 }).lean(),
    Attendance.find().lean(),
    Match.find().sort({ date: -1 }).lean(),
    MatchScore.find().lean(),
  ]);
  return { players, sessions, attendance, matches, matchScores };
}

/** Every player with attendance %, matches played and Ready status. */
export async function getPlayerSummaries(academy) {
  const data = academy || (await loadAcademy());
  return evaluateAllPlayers(data.players, data);
}

export async function getPlayerSummary(playerId, academy) {
  const data = academy || (await loadAcademy());
  const player = data.players.find((row) => key(row._id) === key(playerId));
  if (!player) return null;
  return evaluatePlayer(player, data);
}

export async function getPlayerRecord(playerId) {
  ensureObjectId(playerId, 'player id');
  await connectDB();
  return Player.findById(playerId).lean();
}

/** Coach dashboard counters. */
export async function getCoachStats(academy) {
  const data = academy || (await loadAcademy());
  const summaries = evaluateAllPlayers(data.players, data);
  const closed = data.sessions.filter((session) => session.status === 'closed');
  return {
    totalPlayers: data.players.length,
    totalSessions: data.sessions.length,
    openSessions: data.sessions.length - closed.length,
    totalMatches: data.matches.length,
    readyPlayers: summaries.filter((player) => player.status === 'Ready').length,
    notReadyPlayers: summaries.filter((player) => player.status !== 'Ready').length,
    averageAttendance:
      summaries.length === 0
        ? 0
        : Math.round(
            (summaries.reduce((sum, player) => sum + player.attendancePercent, 0) /
              summaries.length) *
              100
          ) / 100,
  };
}

/** Recent attendance, newest session first, for the coach dashboard. */
export async function getRecentAttendance(academy, limit = 5) {
  const data = academy || (await loadAcademy());
  return data.sessions.slice(0, limit).map((session) => {
    const rows = data.attendance.filter((row) => key(row.sessionId) === key(session._id));
    const present = rows.filter((row) => row.status === 'present').length;
    return {
      id: key(session._id),
      date: session.date,
      sport: session.sport,
      status: session.status,
      marked: rows.length,
      present,
      absent: rows.length - present,
    };
  });
}

/** Session list with attendance counters. */
export async function listSessions() {
  const data = await loadAcademy();
  return data.sessions.map((session) => {
    const rows = data.attendance.filter((row) => key(row.sessionId) === key(session._id));
    const present = rows.filter((row) => row.status === 'present').length;
    return {
      id: key(session._id),
      date: session.date,
      sport: session.sport,
      status: session.status,
      marked: rows.length,
      present,
      absent: rows.length - present,
    };
  });
}

/** One session plus the current marks for every active player. */
export async function getSessionDetail(sessionId) {
  ensureObjectId(sessionId, 'session id');
  await connectDB();
  const [session, players, rows] = await Promise.all([
    PracticeSession.findById(sessionId).lean(),
    Player.find({ active: true }).sort({ name: 1 }).lean(),
    Attendance.find({ sessionId }).lean(),
  ]);
  if (!session) return null;

  const byPlayer = new Map(rows.map((row) => [key(row.playerId), row.status]));
  return {
    id: key(session._id),
    date: session.date,
    sport: session.sport,
    status: session.status,
    locked: session.status === 'closed',
    players: players.map((player) => ({
      id: key(player._id),
      name: player.name,
      sport: player.sport,
      status: byPlayer.get(key(player._id)) || null,
    })),
  };
}

export async function createPlayer({ name, age, sport, guardianContact }) {
  await connectDB();
  const cleanName = String(name || '').trim();
  const cleanSport = String(sport || '').trim();
  const numericAge = Number(age);

  if (!cleanName) throw badRequest('Player name is required.', 'NAME_REQUIRED');
  if (!cleanSport) throw badRequest('Sport is required.', 'SPORT_REQUIRED');
  if (!Number.isFinite(numericAge) || numericAge < 5 || numericAge > 90) {
    throw badRequest('Age must be a number between 5 and 90.', 'INVALID_AGE');
  }

  const player = await Player.create({
    name: cleanName,
    age: numericAge,
    sport: cleanSport,
    guardianContact: String(guardianContact || '').trim(),
  });
  return player.toObject();
}

export async function createSession({ date, sport }, userId) {
  await connectDB();
  if (!isISODate(date)) throw badRequest('Pick a valid session date (YYYY-MM-DD).', 'INVALID_DATE');
  const cleanSport = String(sport || '').trim();
  if (!cleanSport) throw badRequest('Sport is required.', 'SPORT_REQUIRED');

  const existing = await PracticeSession.findOne({ date, sport: cleanSport }).lean();
  if (existing) {
    throw badRequest(
      `A ${cleanSport} session already exists for ${date}.`,
      'SESSION_EXISTS'
    );
  }

  const session = await PracticeSession.create({
    date,
    sport: cleanSport,
    status: 'open',
    createdBy: userId || null,
  });
  return session.toObject();
}

/**
 * Save attendance for a session. Rejects the whole request when the session is
 * closed, so a locked session can never be edited.
 */
export async function markAttendance(sessionId, records, userId) {
  ensureObjectId(sessionId, 'session id');
  await connectDB();
  const [session, players] = await Promise.all([
    PracticeSession.findById(sessionId).lean(),
    Player.find({ active: true }).select('_id').lean(),
  ]);

  if (!session) throw notFound('Session not found.');

  const playerIds = players.map((player) => key(player._id));
  const check = validateAttendanceMarks(session, records, playerIds);
  if (!check.ok) {
    throw badRequest(check.message, check.code);
  }

  const operations = records.map((record) => ({
    updateOne: {
      filter: { sessionId, playerId: record.playerId },
      update: {
        $set: {
          status: record.status,
          date: session.date,
          markedBy: userId || null,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations, { ordered: false });
  return { sessionId: key(session._id), saved: operations.length };
}

export async function closeSession(sessionId, userId) {
  ensureObjectId(sessionId, 'session id');
  await connectDB();
  const session = await PracticeSession.findById(sessionId).lean();
  if (!session) throw notFound('Session not found.');
  if (session.status === 'closed') {
    throw badRequest('This session is already closed.', 'SESSION_LOCKED');
  }

  const marked = await Attendance.countDocuments({ sessionId });
  const players = await Player.countDocuments({ active: true });
  if (marked < players) {
    throw badRequest(
      `Mark every player before closing the session (${marked} of ${players} marked).`,
      'ATTENDANCE_INCOMPLETE'
    );
  }

  await PracticeSession.updateOne(
    { _id: sessionId },
    { $set: { status: 'closed', closedAt: new Date() } }
  );
  return { sessionId: key(session._id), status: 'closed', closedBy: userId || null };
}

export async function createMatch({ date, sport, opponent, venue }, userId) {
  await connectDB();
  if (!isISODate(date)) throw badRequest('Pick a valid match date (YYYY-MM-DD).', 'INVALID_DATE');
  const cleanSport = String(sport || '').trim();
  const cleanOpponent = String(opponent || '').trim();
  if (!cleanSport) throw badRequest('Sport is required.', 'SPORT_REQUIRED');
  if (!cleanOpponent) throw badRequest('Opponent is required.', 'OPPONENT_REQUIRED');

  const match = await Match.create({
    date,
    sport: cleanSport,
    opponent: cleanOpponent,
    venue: String(venue || '').trim(),
    createdBy: userId || null,
  });
  return match.toObject();
}

export async function listMatches() {
  await connectDB();
  const matches = await Match.find().sort({ date: -1 }).lean();
  const scores = await MatchScore.find().lean();
  return matches.map((match) => {
    const rows = scores.filter((row) => key(row.matchId) === key(match._id));
    return {
      id: key(match._id),
      date: match.date,
      sport: match.sport,
      opponent: match.opponent,
      venue: match.venue || '',
      players: rows.length,
      totalScore: rows.reduce((sum, row) => sum + row.score, 0),
    };
  });
}

/** Match sheet: the score rows plus which players are blocked by attendance. */
export async function getMatchDetail(matchId) {
  ensureObjectId(matchId, 'match id');
  await connectDB();
  const match = await Match.findById(matchId).lean();
  if (!match) return null;

  const [players, scores, attendance] = await Promise.all([
    Player.find({ active: true }).sort({ name: 1 }).lean(),
    MatchScore.find({ matchId }).lean(),
    Attendance.find({ date: match.date }).lean(),
  ]);

  const nameOf = new Map(players.map((player) => [key(player._id), player.name]));
  const scored = new Set(scores.map((row) => key(row.playerId)));

  const options = players.map((player) => {
    const check = validateMatchEntry({
      playerId: key(player._id),
      matchDate: match.date,
      attendance,
    });
    return {
      id: key(player._id),
      name: player.name,
      sport: player.sport,
      eligible: check.ok,
      reason: check.ok ? null : check.message,
      alreadyScored: scored.has(key(player._id)),
    };
  });

  return {
    id: key(match._id),
    date: match.date,
    sport: match.sport,
    opponent: match.opponent,
    venue: match.venue || '',
    scores: scores
      .map((row) => ({
        playerId: key(row.playerId),
        playerName: nameOf.get(key(row.playerId)) || 'Unknown player',
        score: row.score,
      }))
      .sort((a, b) => b.score - a.score),
    options,
  };
}

/** Add one player's score to a match, enforcing the absence rule. */
export async function addMatchScore(matchId, { playerId, score }, userId) {
  ensureObjectId(matchId, 'match id');
  ensureObjectId(playerId, 'player');
  await connectDB();
  const match = await Match.findById(matchId).lean();
  if (!match) throw notFound('Match not found.');

  const player = await Player.findById(playerId).lean();
  if (!player) throw badRequest('Player not found in this academy.', 'PLAYER_NOT_FOUND');

  const attendance = await Attendance.find({ date: match.date, playerId }).lean();
  const check = validateMatchEntry({
    playerId,
    matchDate: match.date,
    attendance,
  });
  if (!check.ok) throw badRequest(check.message, check.code);

  const parsed = parseScore(score);
  if (!parsed.ok) throw badRequest(parsed.message, parsed.code);

  const existing = await MatchScore.findOne({ matchId, playerId }).lean();
  if (existing) {
    throw badRequest(
      `${player.name} is already on this score sheet. Remove them first to change the score.`,
      'PLAYER_ALREADY_SCORED'
    );
  }

  await MatchScore.create({
    matchId,
    playerId,
    date: match.date,
    score: parsed.value,
    createdBy: userId || null,
  });

  return { matchId: key(match._id), playerId: key(player._id), score: parsed.value };
}

export async function removeMatchScore(matchId, playerId) {
  ensureObjectId(matchId, 'match id');
  ensureObjectId(playerId, 'player');
  await connectDB();
  const result = await MatchScore.deleteOne({ matchId, playerId });
  if (result.deletedCount === 0) throw notFound('That player is not on this score sheet.');
  return { removed: true };
}

/** Data for the player dashboard: only this player's own rows. */
export async function getPlayerDashboard(playerId) {
  const data = await loadAcademy();
  const player = data.players.find((row) => key(row._id) === key(playerId));
  if (!player) return null;

  const summary = evaluatePlayer(player, data);
  const myAttendance = data.attendance
    .filter((row) => key(row.playerId) === key(playerId))
    .map((row) => {
      const session = data.sessions.find((item) => key(item._id) === key(row.sessionId));
      return {
        date: row.date,
        sport: session?.sport || player.sport,
        status: row.status,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const matchById = new Map(data.matches.map((match) => [key(match._id), match]));
  const myScores = data.matchScores
    .filter((row) => key(row.playerId) === key(playerId))
    .map((row) => {
      const match = matchById.get(key(row.matchId));
      return {
        date: row.date,
        sport: match?.sport || player.sport,
        opponent: match?.opponent || 'Unknown opponent',
        score: row.score,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return { profile: { id: key(player._id), name: player.name, age: player.age, sport: player.sport }, summary, attendance: myAttendance, scores: myScores };
}

/** Find the player record attached to a login account. */
export async function playerIdForUser(userId) {
  await connectDB();
  const user = await User.findById(userId).select('playerId').lean();
  return user?.playerId ? key(user.playerId) : null;
}

/** Scout dashboard: Ready players only, permitted fields only. */
export async function getScoutData() {
  const summaries = await getPlayerSummaries();
  return summaries.filter((player) => player.status === 'Ready');
}

export { canEditAttendance };
