import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canViewPlayer,
  filterVisiblePlayers,
  canOpenArea,
  canWrite,
  homeForRole,
  scoutView,
} from '../src/lib/rbac.js';

const coach = { role: 'coach', userId: 'u-coach', playerId: null };
const playerUser = { role: 'player', userId: 'u-player', playerId: 'p-1' };
const scout = { role: 'scout', userId: 'u-scout', playerId: null };

const evaluated = [
  { id: 'p-1', name: 'Rahul', age: 16, sport: 'Cricket', attendancePercent: 90, matchesPlayed: 3, status: 'Ready' },
  { id: 'p-2', name: 'Amit', age: 15, sport: 'Cricket', attendancePercent: 60, matchesPlayed: 3, status: 'Not Ready' },
  { id: 'p-3', name: 'Rohit', age: 17, sport: 'Football', attendancePercent: 75, matchesPlayed: 2, status: 'Ready' },
];

/* Test 4 — Role access */
test('Test 4: the coach sees every player', () => {
  assert.equal(filterVisiblePlayers(coach, evaluated).length, 3);
  assert.equal(canViewPlayer(coach, evaluated[1]), true);
});

test('Test 4: the scout sees only Ready players', () => {
  const visible = filterVisiblePlayers(scout, evaluated);
  assert.deepEqual(
    visible.map((row) => row.name),
    ['Rahul', 'Rohit']
  );
  assert.equal(canViewPlayer(scout, evaluated[0]), true);
  assert.equal(canViewPlayer(scout, evaluated[1]), false);
});

test('Test 4: a player sees only their own record', () => {
  const visible = filterVisiblePlayers(playerUser, evaluated);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'p-1');
  assert.equal(canViewPlayer(playerUser, evaluated[0]), true);
  assert.equal(canViewPlayer(playerUser, evaluated[1]), false);
});

test('Test 4: an anonymous visitor sees nothing', () => {
  assert.deepEqual(filterVisiblePlayers(null, evaluated), []);
  assert.equal(canViewPlayer(null, evaluated[0]), false);
  assert.equal(canOpenArea(null, 'coach'), false);
});

test('role areas are separated', () => {
  assert.equal(canOpenArea(coach, 'coach'), true);
  assert.equal(canOpenArea(coach, 'scout'), false);
  assert.equal(canOpenArea(playerUser, 'coach'), false);
  assert.equal(canOpenArea(scout, 'scout'), true);
  assert.equal(homeForRole('coach'), '/coach');
  assert.equal(homeForRole('player'), '/player');
  assert.equal(homeForRole('scout'), '/scout');
});

test('only the coach can write', () => {
  assert.equal(canWrite(coach, 'players'), true);
  assert.equal(canWrite(scout, 'players'), false);
  assert.equal(canWrite(playerUser, 'scores'), false);
});

test('the scout view hides contact and account details', () => {
  const view = scoutView({ ...evaluated[0], guardianContact: '9999999999', email: 'a@b.c' });
  assert.deepEqual(Object.keys(view).sort(), [
    'age',
    'attendancePercent',
    'id',
    'matchesPlayed',
    'name',
    'sport',
    'status',
  ]);
});
