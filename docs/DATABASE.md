# Database Design

Six MongoDB collections, exactly as suggested in the project guide. Attendance references **both** a player and a session; match scores reference **both** a match and a player.

```
users ──(playerId)──► players
                         ▲   ▲
                         │   │
sessions ◄──attendance───┘   │
                             │
matches  ◄──matchScores──────┘
```

## users

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `email` | string | Unique, lowercased, used to log in |
| `passwordHash` | string | bcrypt, 10 rounds — never the plain password |
| `role` | string | `coach` \| `player` \| `scout` |
| `playerId` | ObjectId → players | Set only for role `player`; links the login to a player record |
| `createdAt` / `updatedAt` | date | Automatic |

## players

| Field | Type | Notes |
|---|---|---|
| `name` | string | Required, max 80 |
| `age` | number | Required, 5–90 |
| `sport` | string | Required |
| `guardianContact` | string | Optional, coach only — never shown to scouts |
| `active` | boolean | Soft delete; only active players are marked and counted |

## sessions (practice sessions)

| Field | Type | Notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD` — a string, so comparisons never shift with timezones |
| `sport` | string | Required |
| `status` | string | `open` \| `closed` |
| `closedAt` | date | Set when closed |
| `createdBy` | ObjectId → users | The coach who created it |

Indexes: unique on `(date, sport)` — one session per sport per day; `date: -1` for listings.

## attendance

| Field | Type | Notes |
|---|---|---|
| `sessionId` | ObjectId → sessions | Required |
| `playerId` | ObjectId → players | Required |
| `date` | string | Copied from the session, so the match rule is a single indexed lookup |
| `status` | string | `present` \| `absent` |
| `markedBy` | ObjectId → users | The coach who marked it |

Indexes: unique on `(sessionId, playerId)` — a player appears once per session; `(playerId, date)` for the absence rule and attendance percentage.

## matches

| Field | Type | Notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD` |
| `sport` | string | Required |
| `opponent` | string | Required |
| `venue` | string | Optional |
| `createdBy` | ObjectId → users | |

## matchScores

| Field | Type | Notes |
|---|---|---|
| `matchId` | ObjectId → matches | Required |
| `playerId` | ObjectId → players | Required |
| `date` | string | Copied from the match |
| `score` | number | 0–1000 |
| `createdBy` | ObjectId → users | |

Indexes: unique on `(matchId, playerId)` — one score per player per match; `playerId` for counting matches played.

---

## Derived values (never stored)

**Attendance %** = present attendance rows ÷ total sessions held × 100, rounded to 2 decimals.

**Matches played** = number of *distinct* `matchId` values in `matchScores` for that player.

**Ready** = `attendancePercent >= 75 && matchesPlayed >= 2`.

All three are computed on read in `src/lib/core.js`, so they can never fall out of step with the underlying rows.

## Why the duplicated `date` fields

`attendance.date` and `matchScores.date` repeat data that already exists on the parent document. That is intentional: the absence rule asks "was this player marked absent on this date?", and the duplicate turns it into one indexed query on `(playerId, date)` instead of a join across sessions. Keep the two in sync — the service layer always copies the parent's date when it writes a row.

## Data integrity guarantees

- A closed session rejects all attendance writes at the API layer (`SESSION_LOCKED`).
- Unique indexes stop duplicate attendance rows and duplicate scores at the database layer.
- A player absent on a match date is rejected before a score row is written (`PLAYER_ABSENT`).
- Deleting a player is a soft delete (`active: false`) so history stays intact.

## Creating the collections

You do not need to create anything by hand. Mongoose creates the collections and indexes on first write; `npm run seed` does it in one go.
