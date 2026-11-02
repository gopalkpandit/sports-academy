/**
 * Pure business rules for the Sports Academy Management System.
 *
 * Nothing in this file touches the database, the network or React. Every rule
 * from the project guide is expressed here as a plain function so it can be
 * unit tested on its own and reused by both the API routes and the pages.
 */

export const READY_ATTENDANCE_THRESHOLD = 75;
export const READY_MIN_MATCHES = 2;

const key = (value) => (value === null || value === undefined ? '' : String(value));

/** Round to 2 decimals without floating point surprises. */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Attendance % = (Present Sessions / Total Sessions Held) x 100
 */
export function attendancePercent(presentCount, totalSessions) {
  if (!totalSessions || totalSessions <= 0) return 0;
  return round2((presentCount / totalSessions) * 100);
}

/** Attendance rows that belong to one player. */
function attendanceFor(attendance, playerId) {
  const id = key(playerId);
  return (attendance || []).filter((row) => key(row.playerId) === id);
}

/** Distinct matches a player has a score in = matches participated. */
export function matchesPlayed(matchScores, playerId) {
  const id = key(playerId);
  const unique = new Set(
    (matchScores || [])
      .filter((score) => key(score.playerId) === id)
      .map((score) => key(score.matchId))
  );
  return unique.size;
}

/**
 * Evaluate one player.
 *
 * A player is Ready only when BOTH conditions are true:
 *   1. attendance is at least 75%
 *   2. the player has participated in at least 2 matches
 *
 * The comparison uses >= so that exactly 75% counts as eligible (Test 3).
 */
export function evaluatePlayer(player, academy) {
  const { sessions = [], attendance = [], matchScores = [] } = academy || {};
  const rows = attendanceFor(attendance, player._id ?? player.id);
  const presentCount = rows.filter((row) => row.status === 'present').length;
  const absentCount = rows.filter((row) => row.status === 'absent').length;
  const totalSessions = sessions.length;
  const percent = attendancePercent(presentCount, totalSessions);
  const played = matchesPlayed(matchScores, player._id ?? player.id);

  const attendanceOk = totalSessions > 0 && percent >= READY_ATTENDANCE_THRESHOLD;
  const matchesOk = played >= READY_MIN_MATCHES;
  const reasons = [];

  if (!attendanceOk) {
    reasons.push(
      totalSessions === 0
        ? 'No practice sessions have been held yet'
        : `Attendance is ${percent}% (needs at least ${READY_ATTENDANCE_THRESHOLD}%)`
    );
  }
  if (!matchesOk) {
    reasons.push(`Only ${played} match(es) played (needs at least ${READY_MIN_MATCHES})`);
  }

  return {
    id: key(player._id ?? player.id),
    name: player.name,
    age: player.age,
    sport: player.sport,
    presentCount,
    absentCount,
    totalSessions,
    attendancePercent: percent,
    matchesPlayed: played,
    attendanceOk,
    matchesOk,
    status: attendanceOk && matchesOk ? 'Ready' : 'Not Ready',
    reasons,
  };
}

/** Evaluate every player of the academy. */
export function evaluateAllPlayers(players, academy) {
  return (players || []).map((player) => evaluatePlayer(player, academy));
}

/** Only the players whose status is Ready. */
export function readyPlayers(players, academy) {
  return evaluateAllPlayers(players, academy).filter((player) => player.status === 'Ready');
}

/**
 * Rule 3.2 / 3.3: once a session is closed its attendance is locked.
 */
export function canEditAttendance(session) {
  if (!session) {
    return { ok: false, code: 'SESSION_NOT_FOUND', message: 'Session not found.' };
  }
  if (session.status === 'closed') {
    return {
      ok: false,
      code: 'SESSION_LOCKED',
      message: 'This session is closed. Attendance is locked and cannot be changed.',
    };
  }
  return { ok: true };
}

/** Every player must be marked exactly once, as present or absent. */
export function validateAttendanceMarks(session, records, playerIds) {
  const locked = canEditAttendance(session);
  if (!locked.ok) return locked;

  if (!Array.isArray(records) || records.length === 0) {
    return { ok: false, code: 'EMPTY_ATTENDANCE', message: 'No attendance records were sent.' };
  }

  const allowed = new Set((playerIds || []).map(key));
  const seen = new Set();

  for (const record of records) {
    const playerId = key(record?.playerId);
    if (!allowed.has(playerId)) {
      return {
        ok: false,
        code: 'UNKNOWN_PLAYER',
        message: 'Attendance contains a player who is not part of this academy.',
      };
    }
    if (seen.has(playerId)) {
      return {
        ok: false,
        code: 'DUPLICATE_PLAYER',
        message: 'The same player was marked more than once.',
      };
    }
    if (record.status !== 'present' && record.status !== 'absent') {
      return {
        ok: false,
        code: 'INVALID_STATUS',
        message: 'Each player must be marked either present or absent.',
      };
    }
    seen.add(playerId);
  }

  return { ok: true };
}

/**
 * Rule 3.3: a player marked Absent for the practice session on a match date
 * must not be added to that day's match score sheet. The system rejects it.
 */
export function validateMatchEntry({ playerId, matchDate, attendance }) {
  const id = key(playerId);
  if (!id) {
    return { ok: false, code: 'PLAYER_REQUIRED', message: 'Select a player first.' };
  }
  if (!matchDate) {
    return { ok: false, code: 'MATCH_DATE_REQUIRED', message: 'The match has no date.' };
  }

  const absent = (attendance || []).find(
    (row) => key(row.playerId) === id && row.date === matchDate && row.status === 'absent'
  );

  if (absent) {
    return {
      ok: false,
      code: 'PLAYER_ABSENT',
      message:
        'This player was marked Absent for the practice session on ' +
        matchDate +
        ', so they cannot be added to the match score sheet.',
    };
  }

  return { ok: true };
}

/** Normalise a score value coming from a form or an API body. */
export function parseScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) {
    return { ok: false, code: 'INVALID_SCORE', message: 'Score must be a number.' };
  }
  if (score < 0 || score > 1000) {
    return { ok: false, code: 'INVALID_SCORE', message: 'Score must be between 0 and 1000.' };
  }
  return { ok: true, value: score };
}

/** YYYY-MM-DD for today in the academy's timezone (IST by default). */
export function todayISO(timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}
