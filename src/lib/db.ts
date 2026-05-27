import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let MONGODB_URI = process.env.DATABASE_URL!;

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, mongoServer: null };
}

export async function connectToDb() {
  if (cached.conn) {
    return cached.conn;
  }

  // Workaround for restricted sandbox environments failing to resolve DNS SRV records
  // We use mongodb-memory-server in development unless explicitly disabled
  if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_DB_IN_DEV) {
    if (!cached.mongoServer) {
      cached.mongoServer = await MongoMemoryServer.create();
    }
    MONGODB_URI = cached.mongoServer.getUri();
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const AudioRecordSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  lastPosition: { type: Number, default: 0 },
}, { timestamps: true });

// Prevent mongoose from recompiling the model
export const AudioRecord = mongoose.models.AudioRecord || mongoose.model('AudioRecord', AudioRecordSchema);
