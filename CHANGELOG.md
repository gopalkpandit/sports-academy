# Changelog

## 1.0.2

### Added
- **All three roles on the login screen.** Coach, Player and Scout are one-click options that fill in that role's demo account; the fields remain editable for real accounts.
- `GET /api/health` now reports whether the environment is configured, and lists what is missing.

### Fixed
- **"Server error" when signing in.** A missing `MONGODB_URI` or `JWT_SECRET` produced a generic `500`. The API now answers `CONFIG_MISSING` naming the exact variable to set, `DATABASE_UNAVAILABLE` when Atlas is unreachable, and `NO_ACCOUNTS` with a hint to run `npm run seed` when the database is empty.
- Sign-in failures name the demo accounts so the right credentials are easy to find.

## 1.0.1

### Added
- `npm run doctor` — a setup checker that verifies the Node version, `.env`, `MONGODB_URI`, `JWT_SECRET` and the Atlas connection, and prints a concrete fix for each failure.
- A Troubleshooting table in the README covering the errors that come up most often.

### Fixed
- Malformed ids (a hand-typed or truncated id in a URL) now return `400 INVALID_ID` instead of a `500` CastError from Mongoose.
- `GET /api/players/[id]` now returns a proper `404` error body instead of a `200` with `player: null`, so clients show a sensible message.
- Removed the unused `experimental.serverActions` block from `next.config.mjs`.

## 1.0.0

First complete version, built from the Vibe Coding Challenge 2.0 project guide.

### Added
- Player management: add and list players with name, age, sport and optional guardian contact.
- Practice sessions: open a session for a date and sport, mark every player Present or Absent, then close it.
- Attendance locking: a closed session rejects all further attendance writes (`SESSION_LOCKED`).
- Match management: create matches and enter per-player scores.
- Absence rule: a player marked Absent for the session on a match date is rejected from that day's score sheet (`PLAYER_ABSENT`).
- Automatic Ready status: at least 75% attendance **and** at least 2 matches played, computed on read.
- Three roles with server-enforced access control: Coach (everything), Player (own record only), Scout (Ready players only, permitted fields only).
- JWT login with httpOnly cookies and bcrypt password hashing.
- Coach, Player and Scout dashboards.
- REST API covering auth, players, sessions, attendance, matches, scores and ready players.
- Seed script reproducing the guide's example table (Rahul 90%/3/Ready, Amit 60%/3/Not Ready, Rohit 75%/2/Ready, Sumit 85%/1/Not Ready).
- 21 automated tests covering the four mandatory test cases plus the seeded scenario.
- Documentation: README, API reference, database design, test-case walkthrough, deployment guide.
