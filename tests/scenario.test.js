/**
 * End-to-end scenario that replays exactly what `npm run seed` creates, using
 * the same rule functions the API routes use. It proves the demo data really
 * reproduces the example table from the project guide:
 *
 *   Rahul 90% / 3 matches / Ready
 *   Amit  60% / 3 matches / Not Ready
 *   Rohit 75% / 2 matches / Ready
 *   Sumit 85% / 1 match   / Not Ready
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAllPlayers, validateMatchEntry } from '../src/lib/core.js';

const PLAYERS = [
  { _id: 'p1', name: 'Rahul', age: 16, sport: 'Cricket' },
  { _id: 'p2', name: 'Amit', age: 15, sport: 'Cricket' },
  { _id: 'p3', name: 'Rohit', age: 17, sport: 'Cricket' },
  { _id: 'p4', name: 'Sumit', age: 16, sport: 'Football' },
];

const TARGET_PRESENT = { p1: 18, p2: 12, p3: 15, p4: 17 };

function buildAcademy() {
  const sessions = Array.from({ length: 20 }, (_, index) => ({
    _id: `s${index + 1}`,
    date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    sport: 'Cricket',
    status: 'closed',
  }));

  const matchSessionIndexes = [17, 18, 19];
  const attendance = [];

  for (const [playerId, target] of Object.entries(TARGET_PRESENT)) {
    const remainingNeeded = target - matchSessionIndexes.length;
    let assigned = 0;

    sessions.forEach((session, index) => {
      const isMatchDay = matchSessionIndexes.includes(index);
      let present = false;
      if (isMatchDay) present = true;
      else if (assigned < remainingNeeded) {
        present = true;
        assigned += 1;
      }
      attendance.push({
        sessionId: session._id,
        playerId,
        date: session.date,
        status: present ? 'present' : 'absent',
      });
    });
  }

  const matchDates = matchSessionIndexes.map((index) => sessions[index].date);
  const matchScores = [
    ...['p1', 'p2', 'p3', 'p4'].map((playerId) => ({ matchId: 'm1', playerId, date: matchDates[0] })),
    ...['p1', 'p2', 'p3'].map((playerId) => ({ matchId: 'm2', playerId, date: matchDates[1] })),
    ...['p1', 'p2'].map((playerId) => ({ matchId: 'm3', playerId, date: matchDates[2] })),
  ];

  return { sessions, attendance, matchScores, matches: [{ _id: 'm1' }, { _id: 'm2' }, { _id: 'm3' }] };
}

test('seeded academy reproduces the guide example table', () => {
  const academy = buildAcademy();
  const evaluated = evaluateAllPlayers(PLAYERS, academy);
  const table = evaluated.map((row) => ({
    player: row.name,
    attendance: row.attendancePercent,
    matches: row.matchesPlayed,
    status: row.status,
  }));

  assert.deepEqual(table, [
    { player: 'Rahul', attendance: 90, matches: 3, status: 'Ready' },
    { player: 'Amit', attendance: 60, matches: 3, status: 'Not Ready' },
    { player: 'Rohit', attendance: 75, matches: 2, status: 'Ready' },
    { player: 'Sumit', attendance: 85, matches: 1, status: 'Not Ready' },
  ]);
});

test('every seeded match entry passes the absence rule', () => {
  const academy = buildAcademy();
  for (const score of academy.matchScores) {
    const check = validateMatchEntry({
      playerId: score.playerId,
      matchDate: score.date,
      attendance: academy.attendance,
    });
    assert.equal(check.ok, true, `${score.playerId} on ${score.date} should be allowed`);
  }
});

test('a seeded absent player is rejected on that date', () => {
  const academy = buildAcademy();
  // Amit is absent on the first ten session dates.
  const amitAbsentDate = academy.attendance.find(
    (row) => row.playerId === 'p2' && row.status === 'absent'
  ).date;

  const check = validateMatchEntry({
    playerId: 'p2',
    matchDate: amitAbsentDate,
    attendance: academy.attendance,
  });
  assert.equal(check.ok, false);
  assert.equal(check.code, 'PLAYER_ABSENT');
});
