# API Reference

All endpoints live under `/api`. Every response is JSON.

**Success**

```json
{ "ok": true, "data": { } }
```

**Failure**

```json
{ "ok": false, "error": { "code": "PLAYER_ABSENT", "message": "This player was marked Absent ..." } }
```

Authentication is an httpOnly cookie named `academy_session` holding a JWT. Browsers send it automatically; with curl use `-c cookies.txt` on login and `-b cookies.txt` afterwards.

| Status | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Validation or business rule failure (see `code`) |
| 409 | Account already exists |
| 401 | Not logged in |
| 403 | Logged in, wrong role |
| 404 | Not found, or not visible to this role |
| 500 | Server error |

---

## Auth

### POST `/api/auth/login`

```json
{ "email": "account@example.com", "password": "your-password" }
```

```json
{ "ok": true, "data": { "user": { "sub": "…", "name": "Account name", "email": "account@example.com", "role": "coach", "playerId": null }, "redirectTo": "/coach" } }
```

Errors:

| Code | Status | Meaning |
|---|---|---|
| `CREDENTIALS_REQUIRED` | 400 | Email or password missing |
| `INVALID_CREDENTIALS` | 400 | No such account, or the password is wrong |
| `CONFIG_MISSING` | 500 | `MONGODB_URI` or `JWT_SECRET` missing from `.env` — the message names the variable |
| `DATABASE_UNAVAILABLE` | 503 | Atlas could not be reached (usually the IP allowlist) |

### POST `/api/auth/register`

Creates an account and signs it in. Valid roles are `coach`, `player`, and `scout`. Player accounts must also provide `age` (5–90) and `sport`; registration creates and links the player profile atomically.

```json
{ "name": "Account name", "email": "account@example.com", "password": "your-password", "role": "player", "age": 18, "sport": "Cricket" }
```

Returns `201` and a session cookie on success. Duplicate email addresses return `409 EMAIL_EXISTS`.

### POST `/api/auth/logout`

Clears the cookie. Returns `{ "ok": true, "data": { "signedOut": true } }`.

### GET `/api/auth/me`

Returns the current user, or `401 UNAUTHORIZED`.

---

## Players

### GET `/api/players`

What comes back depends on the caller:

- **coach** — every player with full statistics
- **scout** — Ready players only, with permitted fields (`id`, `name`, `age`, `sport`, `attendancePercent`, `matchesPlayed`, `status`)
- **player** — their own record only

```json
{
  "ok": true,
  "data": {
    "players": [
      {
        "id": "6720…",
        "name": "Rahul Kumar",
        "age": 16,
        "sport": "Cricket",
        "presentCount": 18,
        "absentCount": 2,
        "totalSessions": 20,
        "attendancePercent": 90,
        "matchesPlayed": 3,
        "attendanceOk": true,
        "matchesOk": true,
        "status": "Ready",
        "reasons": []
      }
    ]
  }
}
```

### POST `/api/players` — coach only

```json
{ "name": "Rahul Kumar", "age": 16, "sport": "Cricket", "guardianContact": "9800000001" }
```

`201` with the created player. Errors: `NAME_REQUIRED`, `SPORT_REQUIRED`, `INVALID_AGE` (age must be 5–90).

### GET `/api/players/[id]`

`200` with the player, or `404` when the caller may not see that player (a scout asking for a Not Ready player, or a player asking for someone else). A `404` is used rather than `403` so ids cannot be probed.

---

## Sessions

### GET `/api/sessions` — coach only

```json
{ "ok": true, "data": { "sessions": [ { "id": "…", "date": "2026-10-20", "sport": "Cricket", "status": "closed", "marked": 4, "present": 3, "absent": 1 } ] } }
```

### POST `/api/sessions` — coach only

```json
{ "date": "2026-10-21", "sport": "Cricket" }
```

Errors: `INVALID_DATE`, `SPORT_REQUIRED`, `SESSION_EXISTS` (one session per sport per day).

### GET `/api/sessions/[id]` — coach only

Session plus the current mark for every active player (`status` is `null` until marked).

### POST `/api/sessions/[id]/attendance` — coach only

```json
{ "records": [ { "playerId": "…", "status": "present" }, { "playerId": "…", "status": "absent" } ] }
```

Saves with an upsert per player. Rejections:

| Code | When |
|---|---|
| `SESSION_LOCKED` | The session is closed — attendance can never be edited |
| `EMPTY_ATTENDANCE` | No records sent |
| `UNKNOWN_PLAYER` | A player id that is not in this academy |
| `DUPLICATE_PLAYER` | The same player twice in one request |
| `INVALID_STATUS` | A status other than `present` / `absent` |

### POST `/api/sessions/[id]/close` — coach only

Locks the session. Refuses with `ATTENDANCE_INCOMPLETE` while any active player is unmarked, and `SESSION_LOCKED` if already closed.

---

## Matches

### GET `/api/matches` — coach only

Each row carries `players` (how many scored) and `totalScore`.

### POST `/api/matches` — coach only

```json
{ "date": "2026-10-21", "sport": "Cricket", "opponent": "Dumka XI", "venue": "District Ground" }
```

Errors: `INVALID_DATE`, `SPORT_REQUIRED`, `OPPONENT_REQUIRED`.

### GET `/api/matches/[id]` — coach only

The score sheet plus, for every player, whether they are `eligible` for this match and why not.

```json
{
  "ok": true,
  "data": {
    "match": {
      "id": "…", "date": "2026-10-21", "sport": "Cricket", "opponent": "Dumka XI",
      "scores": [ { "playerId": "…", "playerName": "Rahul Kumar", "score": 78 } ],
      "options": [ { "id": "…", "name": "Amit Singh", "eligible": false, "reason": "This player was marked Absent …", "alreadyScored": false } ]
    }
  }
}
```

### POST `/api/matches/[id]/scores` — coach only

```json
{ "playerId": "…", "score": 78 }
```

| Code | When |
|---|---|
| `PLAYER_ABSENT` | The player was marked absent for the session on the match date |
| `PLAYER_ALREADY_SCORED` | Already on this score sheet |
| `INVALID_SCORE` | Not a number, or outside 0–1000 |
| `PLAYER_NOT_FOUND` | Unknown player |

### DELETE `/api/matches/[id]/scores?playerId=…` — coach only

Removes one row from the score sheet.

---

## Ready players

### GET `/api/ready-players` — coach or scout

Ready players only, in the scout's permitted field set. `401` without a cookie, `403` for a player account.

---

## Health

### GET `/api/health`

```json
{
  "ok": true,
  "data": {
    "service": "sports-academy-management-system",
    "status": "up",
    "configured": true,
    "problems": [],
    "time": "2026-11-01T…"
  }
}
```

`status` becomes `needs-configuration` and `problems` lists what is missing when `MONGODB_URI` or `JWT_SECRET` is unset — a quick way to check a deployment from the browser.

---

## Full curl walkthrough

```bash
BASE=http://localhost:3000

# create a coach account and keep the cookie
curl -s -c /tmp/c.txt -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Coach name","email":"coach@example.com","password":"your-password","role":"coach"}'

# create a session for today
curl -s -b /tmp/c.txt -X POST $BASE/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-11-01","sport":"Cricket"}'

# ... mark attendance, close the session, then try to add an absent player to a match
```
