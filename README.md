# Sports Academy Management System

A complete, production-ready web application for a single sports academy. The coach records players, practice attendance and match scores; the system automatically works out who is **Ready** for scouting, and three separate logins (Coach, Player, Scout) each see only what they are allowed to see.

Built for Next.js (App Router), MongoDB Atlas and Vercel.

---

## 1. What it does

| Area | Behaviour |
|---|---|
| **Players** | The coach adds players (name, age, sport, optional guardian contact). One academy, one player list. |
| **Practice sessions** | Open a session for a date and sport, mark every player **Present** or **Absent**, then **Close** it. A closed session locks its attendance permanently. |
| **Matches** | Create a match (date, sport, opponent, venue) and enter each participating player's score. |
| **Match rule** | A player marked **Absent** for the practice session on a match date is **rejected** from that day's score sheet. |
| **Ready status** | A player is Ready only when attendance is **at least 75%** *and* they have played **at least 2 matches**. |
| **Dashboards** | Coach: totals, ready count, recent attendance, full management. Player: own profile, attendance, scores, ready status. Scout: Ready players only. |
| **Access control** | Every rule is enforced on the server in the API routes, not by hiding buttons in the UI. |

Out of scope by design: payments, video, mobile app, chat, WhatsApp, maps.

---

## 2. Tech stack

- **Next.js 15** (App Router, server components + route handlers) — frontend and backend in one project
- **MongoDB Atlas** with **Mongoose 8** — cloud database
- **Node.js 20, 22 or 24** — runtime (tested on Node 24)
- **JWT in an httpOnly cookie** + **bcryptjs** password hashing — own login system, no third-party auth
- **Vercel** — hosting
- **Node's built-in test runner** — 21 automated tests, no extra test framework

---

## 3. Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env
#    then edit .env and paste your MongoDB Atlas URI and a JWT secret

# 3. check your setup (recommended — tells you exactly what is missing)
npm run doctor

# 4. run
npm run dev
# open http://localhost:3000
```

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create a Coach, Player, or Scout account from **Create an account**. Player registration creates the linked player profile. Accounts can sign in immediately after registration.

`npm run seed` is optional and intended only for a disposable database. It clears existing users and academy records before inserting sample data; do not run it against a database containing real data.

The seed script creates an example academy with 4 players, 20 closed sessions and 3 matches:

| Player | Attendance | Matches | Status |
|---|---|---|---|
| Rahul | 90% | 3 | Ready |
| Amit | 60% | 3 | Not Ready |
| Rohit | 75% | 2 | Ready |
| Sumit | 85% | 1 | Not Ready |

---

## 4. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB Atlas connection string. Whitelist `0.0.0.0/0` in Atlas for Vercel deployments. |
| `JWT_SECRET` | yes | Signs the login cookie. Use a long random string; changing it signs everyone out. |

`.env` is git-ignored. On Vercel, add both in **Project → Settings → Environment Variables**.

---

## 5. Project structure

```
sports-academy/
├─ src/
│  ├─ app/
│  │  ├─ layout.js                 root layout + metadata
│  │  ├─ page.js                   "/" → redirects to the right dashboard
│  │  ├─ login/page.js             login screen
│  │  ├─ coach/
│  │  │  ├─ layout.js              server-side coach guard
│  │  │  ├─ page.js                coach dashboard
│  │  │  ├─ players/page.js        add + list players
│  │  │  ├─ sessions/page.js       create + list sessions
│  │  │  ├─ sessions/[id]/page.js  mark attendance, close & lock
│  │  │  ├─ matches/page.js        create + list matches
│  │  │  └─ matches/[id]/page.js   score sheet + absence rule
│  │  ├─ player/page.js            player dashboard (own record only)
│  │  ├─ scout/page.js             scout dashboard (Ready only)
│  │  └─ api/…                     REST API (see docs/API.md)
│  ├─ components/                  forms, attendance grid, top bar
│  └─ lib/
│     ├─ core.js                   ⭐ all business rules (pure, unit tested)
│     ├─ rbac.js                   ⭐ role permissions (pure, unit tested)
│     ├─ service.js                data access + rule enforcement
│     ├─ auth.js                   JWT sign/verify, cookie helpers
│     ├─ guard.js                  server-side route guards
│     ├─ db.js                     cached Mongoose connection
│     └─ models/                   User, Player, PracticeSession, Attendance, Match, MatchScore
├─ scripts/seed.js                 optional sample data
├─ tests/                          core, rbac and seed-scenario tests
└─ docs/                           API, database, test cases, deployment
```

The two files worth reading first are `src/lib/core.js` (every rule in the guide as a small function) and `src/lib/rbac.js` (who may see what). Both are pure and covered by tests, and both are used by the API routes *and* the pages — so a rule cannot drift between the UI and the server.

---

## 6. The rules, in code

**Attendance percentage** — `src/lib/core.js`

```js
attendancePercent = (presentSessions / totalSessionsHeld) * 100
```

Total sessions held = every practice session created in the academy. The value is rounded to 2 decimals, so 3 of 4 sessions is exactly `75`.

**Ready status**

```js
status = attendancePercent >= 75 && matchesPlayed >= 2 ? 'Ready' : 'Not Ready'
```

`>=` is deliberate: exactly 75% with exactly 2 matches counts as Ready (Test 3).

**Locked sessions** — `validateAttendanceMarks()` returns `SESSION_LOCKED` once `session.status === 'closed'`, and the API answers `400`.

**Absence rule** — `validateMatchEntry()` looks for an attendance row for that player on the match date with `status === 'absent'` and returns `PLAYER_ABSENT` if found. The score API rejects it with `400`, so the rule holds even if someone calls the API directly.

**Role access** — `filterVisiblePlayers()` and `canViewPlayer()` decide what each role gets: coach → everyone, scout → Ready players only (and never contact details), player → their own record only.

---

## 7. Tests

```bash
npm test
```

21 tests, all passing, covering the four mandatory test cases:

- **Test 1 — Attendance**: three players, one session, two Present and one Absent; the absent row stays `absent`. Plus locked-session, duplicate-player, unknown-player and bad-status rejections.
- **Test 2 — Match validation**: a Present player is accepted, an Absent player is rejected with `PLAYER_ABSENT`, absence on a different date does not block a match.
- **Test 3 — Ready status**: below 75% is Not Ready; exactly 75% with 2 matches is Ready; 100% with 1 match is still Not Ready.
- **Test 4 — Role access**: coach sees 3 players, scout sees only the Ready ones, player sees only their own row, anonymous sees nothing.
- **Seed scenario**: replays the seeded academy and asserts the guide's example table exactly.

The full manual walkthrough (what to click, what to expect) is in [`docs/TEST-CASES.md`](docs/TEST-CASES.md).

---

## 8. Deploying to Vercel

1. Push the repo to GitHub, named `vibe-coding-challenge-2-0-<team-name>`.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Next.js; no build settings to change.
3. Add `MONGODB_URI` and `JWT_SECRET` as environment variables (Production **and** Preview).
4. Deploy. Open the URL, log in as the coach, and run through `docs/TEST-CASES.md` once on the live site.
5. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0` (or Vercel's IPs) so the serverless functions can connect.

More detail, including Atlas setup from scratch, is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 9. API at a glance

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/auth/login` | anyone | Log in, sets the httpOnly cookie |
| POST | `/api/auth/logout` | anyone | Clear the cookie |
| GET | `/api/auth/me` | any logged-in user | Current user |
| GET | `/api/players` | all roles | Coach: everyone · Scout: Ready only · Player: self |
| POST | `/api/players` | coach | Add a player |
| GET | `/api/players/[id]` | all roles | Single player, permission-checked |
| GET | `/api/sessions` | coach | List sessions |
| POST | `/api/sessions` | coach | Create a session |
| GET | `/api/sessions/[id]` | coach | Session + marks |
| POST | `/api/sessions/[id]/attendance` | coach | Save Present/Absent (rejected when closed) |
| POST | `/api/sessions/[id]/close` | coach | Close and lock |
| GET | `/api/matches` | coach | List matches |
| POST | `/api/matches` | coach | Create a match |
| GET | `/api/matches/[id]` | coach | Score sheet + eligibility |
| POST | `/api/matches/[id]/scores` | coach | Add a score (rejects absent players) |
| DELETE | `/api/matches/[id]/scores?playerId=` | coach | Remove a score |
| GET | `/api/ready-players` | coach, scout | Ready players only |
| GET | `/api/health` | anyone | Liveness check |

Errors are always `{ "ok": false, "error": { "code", "message" } }`; success is `{ "ok": true, "data": … }`. Full request/response examples: [`docs/API.md`](docs/API.md).

---

## 10. Things worth knowing

- **Session dates are stored as `YYYY-MM-DD` strings**, not `Date` objects. Comparing `'2026-10-05' === '2026-10-05'` cannot drift with timezones, which is exactly what the absence rule needs. `todayISO()` formats in `Asia/Kolkata`.
- **One session per sport per day** (unique index on `date + sport`). The absence rule checks attendance for the whole date, so if you ever run two sports in one day, a player absent in either one cannot play a match that day.
- **Attendance must be complete before closing** — the close endpoint refuses if fewer marks exist than active players.
- **`matchScores` counts distinct matches**, so a duplicate row can never inflate a player's match count.
- **Ready status is computed on read**, never stored, so it is always in step with the underlying attendance and scores.
- **Server-side guards** live in `src/lib/guard.js`; the layouts also redirect, but the API is the real gate. Opening `/api/ready-players` without a cookie returns `401`, and as a player it returns `403`.

---

## 11. Troubleshooting

Run `npm run doctor` first — it checks the four things that break most setups (Node version, `.env`, `MONGODB_URI`, `JWT_SECRET`) and prints the exact fix.

| Symptom | Cause | Fix |
|---|---|---|
| **"Server error" / `CONFIG_MISSING` on sign in** | `MONGODB_URI` or `JWT_SECRET` missing from `.env` | The message now names the variable; add it and restart `npm run dev` |
| **`NO_ACCOUNTS` on sign in** | The database is connected but empty | Run `npm run seed` once |
| `MONGODB_URI is not set` | No `.env`, or the file is in the wrong folder | Create `.env` next to `package.json` from `.env.example` |
| `ECONNREFUSED` / `Could not connect to any servers` | Atlas is blocking your IP | Atlas → Network Access → allow `0.0.0.0/0` |
| `bad auth : authentication failed` | Wrong user or password | Recheck the URI; URL-encode `@ : / ? #` in the password |
| Login works, but every page bounces to `/login` | `JWT_SECRET` missing or changed | Set it in `.env` (and in Vercel) |
| `E11000 duplicate key` | Old data with a conflicting index | `npm run seed` clears the collections first |
| Nothing in the player dropdown on a match | No session was held on that match date | Create a session for that date and mark players present |
| `Invalid session id` / `That player is not valid` | A malformed id in the URL | Use the ids from the app, not hand-typed ones |

## 12. Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server on `:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run all 21 tests |
| `npm run seed` | Reset the database and load demo data |
| `npm run doctor` | Check Node version, `.env`, `MONGODB_URI`, `JWT_SECRET` and the Atlas connection, with a fix hint for each failure |

---

## 13. Submission checklist

- [ ] Public GitHub repo name `https://github.com/gopalkpandit/sports-academy`
- [ ] `.env` never committed (only `.env.example`)
- [ ] All four mandatory test cases verified on the live URL
- [ ] Live Vercel URL submitted
- [ ] No commits after the official end time
