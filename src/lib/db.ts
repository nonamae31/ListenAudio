import Database from 'better-sqlite3';
import path from 'path';

// Using a singleton pattern to ensure the database connection is shared across API routes
let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(path.resolve(process.cwd(), 'audio_records.db'));
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
  }
  return db;
}
