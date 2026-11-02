import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Cached connection so that Next.js hot reload and serverless invocations do
 * not open a new pool on every request.
 */
const cache = globalThis.__academyMongoose ?? { conn: null, promise: null };
globalThis.__academyMongoose = cache;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and add your MongoDB Atlas connection string.'
    );
  }
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 10000 })
      .then((instance) => instance);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
