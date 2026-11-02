import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attendancePercent,
  evaluatePlayer,
  evaluateAllPlayers,
  readyPlayers,
  validateAttendanceMarks,
  validateMatchEntry,
  canEditAttendance,
  parseScore,
  isISODate,
} from '../src/lib/core.js';

const PLAYER_A = 'p-rahul';
const PLAYER_B = 'p-amit';
const PLAYER_C = 'p-rohit';

const player = (id, name) => ({ _id: id, name, age: 15, sport: 'Cricket' });

const session = (id, date, status = 'closed') => ({ _id: id, date, sport: 'Cricket', status });

const attendanceRow = (sessionId, playerId, date, status) => ({
  sessionId,
  playerId,
  date,
  status,
});

/* ------------------------------------------------------------------ */
/* Test 1 — Attendance                                                 */
/* ------------------------------------------------------------------ */
test('Test 1: two players Present and one Absent keeps the absent row as Absent', () => {
  const players = [player(PLAYER_A, 'Rahul'), player(PLAYER_B, 'Amit'), player(PLAYER_C, 'Rohit')];
  const sessions = [session('s1', '2026-10-01', 'open')];

  const records = [
    { playerId: PLAYER_A, status: 'present' },
    { playerId: PLAYER_B, status: 'present' },
    { playerId: PLAYER_C, status: 'absent' },
  ];

  const check = validateAttendanceMarks(sessions[0], records, players.map((p) => p._id));
  assert.equal(check.ok, true);

  const attendance = records.map((record) =>
    attendanceRow('s1', record.playerId, '2026-10-01', record.status)
  );

  const evaluated = evaluateAllPlayers(players, { sessions, attendance, matchScores: [] });
  const byName = Object.fromEntries(evaluated.map((row) => [row.name, row]));

  assert.equal(byName.Rahul.presentCount, 1);
  assert.equal(byName.Amit.presentCount, 1);
  assert.equal(byName.Rohit.presentCount, 0);
  assert.equal(byName.Rohit.absentCount, 1);
  assert.equal(byName.Rohit.attendancePercent, 0);

  // The stored status for the absent player is exactly "absent".
  const rohitRow = attendance.find((row) => row.playerId === PLAYER_C);
  assert.equal(rohitRow.status, 'absent');
});

test('Test 1b: attendance is rejected once the session is closed (locked)', () => {
  const closed = session('s1', '2026-10-01', 'closed');
  const check = validateAttendanceMarks(
    closed,
    [{ playerId: PLAYER_A, status: 'present' }],
    [PLAYER_A]
  );
  assert.equal(check.ok, false);
  assert.equal(check.code, 'SESSION_LOCKED');
  assert.equal(canEditAttendance(closed).ok, false);
  assert.equal(canEditAttendance(session('s2', '2026-10-02', 'open')).ok, true);
});

test('Test 1c: attendance rejects unknown players, duplicates and bad statuses', () => {
  const open = session('s1', '2026-10-01', 'open');
  assert.equal(
    validateAttendanceMarks(open, [{ playerId: 'ghost', status: 'present' }], [PLAYER_A]).code,
    'UNKNOWN_PLAYER'
  );
  assert.equal(
    validateAttendanceMarks(
      open,
      [
        { playerId: PLAYER_A, status: 'present' },
        { playerId: PLAYER_A, status: 'absent' },
      ],
      [PLAYER_A]
    ).code,
    'DUPLICATE_PLAYER'
  );
  assert.equal(
    validateAttendanceMarks(open, [{ playerId: PLAYER_A, status: 'maybe' }], [PLAYER_A]).code,
    'INVALID_STATUS'
  );
});

/* ------------------------------------------------------------------ */
/* Test 2 — Match validation                                           */
/* ------------------------------------------------------------------ */
test('Test 2: a player marked Absent on the match date is rejected from the score sheet', () => {
  const matchDate = '2026-10-01';
  const attendance = [
    attendanceRow('s1', PLAYER_A, matchDate, 'present'),
    attendanceRow('s1', PLAYER_B, matchDate, 'present'),
    attendanceRow('s1', PLAYER_C, matchDate, 'absent'),
  ];

  assert.equal(validateMatchEntry({ playerId: PLAYER_A, matchDate, attendance }).ok, true);
  assert.equal(validateMatchEntry({ playerId: PLAYER_B, matchDate, attendance }).ok, true);

  const rejected = validateMatchEntry({ playerId: PLAYER_C, matchDate, attendance });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.code, 'PLAYER_ABSENT');
  assert.match(rejected.message, /Absent/);
});

test('Test 2b: absence on a different date does not block a match', () => {
  const attendance = [attendanceRow('s1', PLAYER_C, '2026-09-28', 'absent')];
  const result = validateMatchEntry({ playerId: PLAYER_C, matchDate: '2026-10-01', attendance });
  assert.equal(result.ok, true);
});

test('Test 2c: no practice session that day means the player may play', () => {
  const result = validateMatchEntry({ playerId: PLAYER_C, matchDate: '2026-10-05', attendance: [] });
  assert.equal(result.ok, true);
});

/* ------------------------------------------------------------------ */
/* Test 3 — Ready status                                               */
/* ------------------------------------------------------------------ */
test('Test 3: below 75% is Not Ready, exactly 75% with two matches is Ready', () => {
  const sessions = [
    session('s1', '2026-10-01'),
    session('s2', '2026-10-02'),
    session('s3', '2026-10-03'),
    session('s4', '2026-10-04'),
  ];

  // Player A: 2 of 4 present = 50% (below the threshold), 3 matches played.
  const playerA = player(PLAYER_A, 'Player A');
  const attendanceA = [
    attendanceRow('s1', PLAYER_A, '2026-10-01', 'present'),
    attendanceRow('s2', PLAYER_A, '2026-10-02', 'present'),
    attendanceRow('s3', PLAYER_A, '2026-10-03', 'absent'),
    attendanceRow('s4', PLAYER_A, '2026-10-04', 'absent'),
  ];
  const scoresA = ['m1', 'm2', 'm3'].map((matchId) => ({ matchId, playerId: PLAYER_A, score: 40 }));

  const resultA = evaluatePlayer(playerA, {
    sessions,
    attendance: attendanceA,
    matchScores: scoresA,
  });
  assert.equal(resultA.attendancePercent, 50);
  assert.equal(resultA.matchesPlayed, 3);
  assert.equal(resultA.status, 'Not Ready');

  // Player B: 3 of 4 present = exactly 75%, and 2 matches played.
  const playerB = player(PLAYER_B, 'Player B');
  const attendanceB = [
    attendanceRow('s1', PLAYER_B, '2026-10-01', 'present'),
    attendanceRow('s2', PLAYER_B, '2026-10-02', 'present'),
    attendanceRow('s3', PLAYER_B, '2026-10-03', 'present'),
    attendanceRow('s4', PLAYER_B, '2026-10-04', 'absent'),
  ];
  const scoresB = ['m1', 'm2'].map((matchId) => ({ matchId, playerId: PLAYER_B, score: 30 }));

  const resultB = evaluatePlayer(playerB, {
    sessions,
    attendance: attendanceB,
    matchScores: scoresB,
  });
  assert.equal(resultB.attendancePercent, 75);
  assert.equal(resultB.matchesPlayed, 2);
  assert.equal(resultB.status, 'Ready');

  const academy = {
    sessions,
    attendance: [...attendanceA, ...attendanceB],
    matchScores: [...scoresA, ...scoresB],
  };
  const ready = readyPlayers([playerA, playerB], academy);
  assert.deepEqual(
    ready.map((row) => row.name),
    ['Player B']
  );
});

test('Test 3b: high attendance alone is not enough without two matches', () => {
  const sessions = [session('s1', '2026-10-01'), session('s2', '2026-10-02')];
  const attendance = [
    attendanceRow('s1', PLAYER_A, '2026-10-01', 'present'),
    attendanceRow('s2', PLAYER_A, '2026-10-02', 'present'),
  ];
  const result = evaluatePlayer(player(PLAYER_A, 'Sumit'), {
    sessions,
    attendance,
    matchScores: [{ matchId: 'm1', playerId: PLAYER_A, score: 50 }],
  });
  assert.equal(result.attendancePercent, 100);
  assert.equal(result.matchesPlayed, 1);
  assert.equal(result.status, 'Not Ready');
});

test('Test 3c: the same match counted twice is still one match', () => {
  const scores = [
    { matchId: 'm1', playerId: PLAYER_A, score: 10 },
    { matchId: 'm1', playerId: PLAYER_A, score: 20 },
  ];
  const result = evaluatePlayer(player(PLAYER_A, 'Rahul'), {
    sessions: [session('s1', '2026-10-01')],
    attendance: [attendanceRow('s1', PLAYER_A, '2026-10-01', 'present')],
    matchScores: scores,
  });
  assert.equal(result.matchesPlayed, 1);
});

test('attendance percent rounds to two decimals and handles zero sessions', () => {
  assert.equal(attendancePercent(0, 0), 0);
  assert.equal(attendancePercent(1, 3), 33.33);
  assert.equal(attendancePercent(2, 3), 66.67);
  assert.equal(attendancePercent(3, 4), 75);
});

test('scores and dates are validated', () => {
  assert.equal(parseScore('42').value, 42);
  assert.equal(parseScore(-1).ok, false);
  assert.equal(parseScore('abc').ok, false);
  assert.equal(isISODate('2026-10-01'), true);
  assert.equal(isISODate('01-10-2026'), false);
});
