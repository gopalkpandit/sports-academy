/**
 * Setup checker.
 *
 *   npm run doctor
 *
 * Tells you exactly what is missing before you start the app: Node version,
 * .env file, MONGODB_URI, JWT_SECRET and whether Atlas is reachable.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Read .env without any dependency, so `npm run doctor` also works before
 * `npm install` has been run.
 */
function loadEnvFile() {
  const file = path.join(process.cwd(), '.env');
  if (!existsSync(file)) return false;

  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return true;
}

const envFileFound = loadEnvFile();

const PASS = 'OK  ';
const FAIL = 'FAIL';
const WARN = 'WARN';

let problems = 0;

function line(status, label, detail = '') {
  console.log(`${status}  ${label}${detail ? ` — ${detail}` : ''}`);
}

function check(ok, label, detail, { warnOnly = false } = {}) {
  if (ok) return line(PASS, label, detail);
  if (warnOnly) return line(WARN, label, detail);
  problems += 1;
  line(FAIL, label, detail);
}

console.log('\nSports Academy — setup check\n');

/* Node version */
const major = Number(process.versions.node.split('.')[0]);
check(major >= 20, `Node.js ${process.versions.node}`, major >= 20 ? 'supported' : 'Node 20 or newer is required');

/* .env file */
check(
  envFileFound,
  '.env file',
  envFileFound ? 'found next to package.json' : 'missing — copy .env.example to .env'
);

/* MONGODB_URI */
const uri = process.env.MONGODB_URI;
if (!uri) {
  problems += 1;
  line(FAIL, 'MONGODB_URI', 'missing — paste your MongoDB Atlas connection string into .env');
} else if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  problems += 1;
  line(FAIL, 'MONGODB_URI', 'does not start with mongodb:// or mongodb+srv://');
} else if (/<|>/.test(uri)) {
  problems += 1;
  line(FAIL, 'MONGODB_URI', 'still contains <placeholders> — replace them with your username and password');
} else {
  const database = uri.split('/').pop().split('?')[0] || '(default)';
  line(PASS, 'MONGODB_URI', `database "${database}"`);
}

/* JWT_SECRET */
const secret = process.env.JWT_SECRET;
if (!secret) {
  problems += 1;
  line(FAIL, 'JWT_SECRET', 'missing — add a long random string to .env');
} else if (secret.length < 16) {
  problems += 1;
  line(FAIL, 'JWT_SECRET', `too short (${secret.length} chars) — use at least 32`);
} else {
  line(PASS, 'JWT_SECRET', `${secret.length} characters`);
}

/* Dependencies */
const depsInstalled = existsSync(path.join(process.cwd(), 'node_modules', 'next'));
check(
  depsInstalled,
  'node_modules',
  depsInstalled ? 'dependencies installed' : 'missing — run `npm install` first'
);

/* Database connection */
if (!depsInstalled) {
  line(WARN, 'MongoDB connection', 'skipped until npm install has run');
} else if (uri && !/<|>/.test(uri)) {
  console.log('\nConnecting to MongoDB…');
  try {
    const { default: mongoose } = await import('mongoose');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const admin = mongoose.connection.db;
    const names = (await admin.listCollections().toArray()).map((c) => c.name).sort();

    line(PASS, 'MongoDB connection', mongoose.connection.host);

    if (names.length === 0) {
      line(WARN, 'Collections', 'none yet — run `npm run seed` to load demo data');
    } else {
      const counts = await Promise.all(
        ['users', 'players', 'sessions', 'attendance', 'matches', 'matchScores'].map(async (name) => {
          if (!names.includes(name)) return `${name}: 0`;
          return `${name}: ${await admin.collection(name).countDocuments()}`;
        })
      );
      line(PASS, 'Collections', counts.join(' · '));
      const users = names.includes('users') ? await admin.collection('users').countDocuments() : 0;
      if (users === 0) line(WARN, 'Logins', 'no users yet — run `npm run seed`, or you cannot log in');
    }
    await mongoose.disconnect();
  } catch (error) {
    problems += 1;
    line(FAIL, 'MongoDB connection', error.message);
    console.log('\n  Common fixes:');
    console.log('   • Atlas → Network Access → allow 0.0.0.0/0');
    console.log('   • Check the username and password in the URI');
    console.log('   • If the password has @ : / ? # characters, URL-encode them');
  }
}

console.log('');
if (problems === 0) {
  console.log('Everything looks good. Start the app with:  npm run dev');
  console.log('Then open http://localhost:3000\n');
} else {
  console.log(`${problems} problem(s) found. Fix them above, then run npm run doctor again.\n`);
  process.exitCode = 1;
}
