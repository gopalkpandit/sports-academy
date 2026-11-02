# Mandatory Test Cases — Manual Walkthrough

The four test cases from the project guide, plus what to click and what you should see. The same rules are covered automatically by `npm test` (21 tests).

Run `npm run seed` first so you have players, sessions and matches to work with. Every step below is done as the coach (`coach@academy.in` / `password123`) unless stated otherwise.

---

## Test 1 — Attendance

**Goal:** three players, one session, two Present and one Absent, and the absent player's row really shows Absent.

1. Log in as the coach → **Players**. Add three players (e.g. Test A, Test B, Test C, all Cricket).
   *Already seeded? Skip to step 2 — Rahul, Amit and Rohit will do.*
2. Go to **Sessions** → create a session for today, sport Cricket.
3. Open the session. Every player is listed with **Present** / **Absent** radio buttons.
4. Mark two players **Present** and one **Absent** → **Save attendance**.
5. The success banner appears and each row now reads "currently marked present / absent".

**Expected:** the absent player's attendance row is stored as `absent`. Their dashboard shows the missed session, and the session list shows Present 2 / Absent 1.

**Also verify:** click **Close session & lock attendance**. The radios become disabled, the lock notice appears, and a direct API call to the attendance endpoint returns:

```json
{ "ok": false, "error": { "code": "SESSION_LOCKED", "message": "This session is closed. Attendance is locked and cannot be changed." } }
```

---

## Test 2 — Match validation

**Goal:** a player marked Absent for the practice session on the match date cannot be added to that day's score sheet.

1. Note the date of the session from Test 1, and which player was Absent.
2. **Matches** → create a match **on the same date**, sport Cricket, any opponent.
3. Open the match. In the player dropdown, the absent player appears greyed out with the note *"— absent for the session on this date"*.
4. Add scores for the two Present players — both are accepted and appear in the score sheet.
5. Now force the absent player: select them (or call the API directly) and submit.

**Expected:** the system rejects the attempt. The page shows a red banner; the API returns `400`:

```json
{ "ok": false, "error": { "code": "PLAYER_ABSENT", "message": "This player was marked Absent for the practice session on 2026-11-01, so they cannot be added to the match score sheet." } }
```

The match page also lists the blocked player under **Blocked by attendance**, with the reason.

Verify with curl:

```bash
curl -s -b /tmp/c.txt -X POST $BASE/api/matches/<MATCH_ID>/scores \
  -H 'Content-Type: application/json' \
  -d '{"playerId":"<ABSENT_PLAYER_ID>","score":50}'
```

---

## Test 3 — Ready status

**Goal:** below 75% is Not Ready; exactly 75% with two matches is Ready.

The seeded academy is built to prove this out of the box:

| Player | Attendance | Matches | Status |
|---|---|---|---|
| Rahul | 90% | 3 | **Ready** |
| Amit | 60% | 3 | **Not Ready** |
| Rohit | **75%** | **2** | **Ready** |
| Sumit | 85% | 1 | **Not Ready** |

Rohit is the important row: exactly 75% and exactly 2 matches, and he is Ready — the comparison is `>=`, not `>`.

**To build it yourself:** create 4 sessions, mark one player present in 3 of them (75%) and add them to 2 matches → Ready. Mark another player present in 2 of 4 (50%) → Not Ready, even with 3 matches.

**Where to look:** Coach → **Players** shows Present/Attendance/Matches/Status for everyone; Coach dashboard shows the Ready count; the Scout dashboard lists only Rahul and Rohit.

---

## Test 4 — Role access

**Goal:** the Scout sees only Ready players; a Player sees only their own record.

### As the Scout (`scout@academy.in`)

1. Log in. You land on **/scout**.
2. The table lists Rahul and Rohit only — Amit (60%) and Sumit (1 match) are absent.
3. No contact details, no account information — only name, age, sport, attendance %, matches, status.
4. Try to open a coach URL directly: `http://localhost:3000/coach` → you are redirected away.
5. Try the API: `GET /api/players` returns only the Ready players; `POST /api/players` returns `403 FORBIDDEN`.

### As a Player (`rahul@academy.in`)

1. Log in. You land on **/player** and see your own attendance, scores and Ready status.
2. `GET /api/players` returns exactly one record — your own.
3. `GET /api/players/<someone-else>` returns `404`.
4. `GET /api/ready-players` returns `403 FORBIDDEN` — that endpoint is coach/scout only.
5. Opening `/coach` or `/scout` redirects you away.

### As an anonymous visitor

`curl -s $BASE/api/players` → `401 UNAUTHORIZED`. No data is served without a cookie.

---

## Extra checks worth doing

- **Incomplete close**: create a session, mark only some players, then try to close it → `400 ATTENDANCE_INCOMPLETE` with the count.
- **Duplicate session**: create the same date + sport twice → `400 SESSION_EXISTS`.
- **Score twice**: add the same player to the same match twice → `400 PLAYER_ALREADY_SCORED`.
- **Match count integrity**: a player with 1 match stays Not Ready even at 100% attendance.
- **Bad score**: submit `-5` or `abc` → `400 INVALID_SCORE`.
