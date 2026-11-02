# Deployment Guide

From an empty MongoDB account to a live Vercel URL.

## 1. MongoDB Atlas

1. Sign in at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free M0 cluster** (any region close to your users — Mumbai `ap-south-1` for India).
2. **Database Access → Add New Database User**: username + password, role *Read and write to any database*. Avoid `@`, `:` or `/` in the password, or URL-encode them.
3. **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`). Serverless functions do not have fixed IPs.
4. **Clusters → Connect → Drivers → Node.js**: copy the connection string and add the database name:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sports_academy?retryWrites=true&w=majority
```

Test it locally with `npm run seed` before deploying.

## 2. Local run

```bash
npm install
cp .env.example .env      # paste MONGODB_URI, set JWT_SECRET
npm run seed
npm run dev               # http://localhost:3000
```

## 3. GitHub

```bash
git init
git add .
git commit -m "Sports Academy Management System"
git branch -M main
git remote add origin https://github.com/<you>/vibe-coding-challenge-2-0-<team-name>.git
git push -u origin main
```

Check that `.env` is **not** in the commit (`git status` should never list it — it is git-ignored).

## 4. Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build `next build`, output handled automatically. No changes needed.
3. **Environment Variables** — add both, for Production *and* Preview:
   - `MONGODB_URI` = your Atlas string
   - `JWT_SECRET` = a long random string
4. **Deploy**, then open the URL.
5. On the live site: log in as the coach, then work through `docs/TEST-CASES.md`.

## 5. After deploying

- Run the four test cases on the live URL, not just locally.
- If pages hang for ~10s and then error, Atlas is refusing the connection — recheck Network Access and that the password in the URI is URL-encoded.
- If login succeeds but every page bounces back to `/login`, `JWT_SECRET` is missing in that environment.
- Cookies are `secure` in production, so the site must be served over HTTPS — Vercel does this automatically.

## 6. Updating

Push to `main` → Vercel redeploys automatically. **Do not push after the official end time**; a later commit can disqualify the team.

## 7. Optional: reseed production

Run the seed once against Atlas from your machine with the production `MONGODB_URI` in `.env`:

```bash
npm run seed
```

**This deletes all existing data** in that database — never run it once real players exist.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `MONGODB_URI is not set` | Missing env var | Add it to `.env` (local) or Vercel (deployed) |
| `Could not connect to any servers` | IP not whitelisted | Atlas → Network Access → `0.0.0.0/0` |
| `bad auth : authentication failed` | Wrong user/password | Recheck the URI; URL-encode special characters |
| Redirected to `/login` in a loop | `JWT_SECRET` missing or changed | Set it and redeploy |
| `E11000 duplicate key` while seeding | Index conflict from older data | `npm run seed` clears the collections first |
