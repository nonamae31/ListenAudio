import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless invocations.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDb() {
  const MONGODB_URI = process.env.DATABASE_URL;

  if (!MONGODB_URI) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env or Vercel Environment Variables');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
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
