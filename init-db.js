const Database = require('better-sqlite3');
const db = new Database('audio_records.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS AudioRecords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    lastPosition REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("Database initialized successfully.");

// Test insert
const insert = db.prepare('INSERT INTO AudioRecords (url, lastPosition) VALUES (?, ?) ON CONFLICT(url) DO UPDATE SET lastPosition=excluded.lastPosition, updatedAt=CURRENT_TIMESTAMP');
insert.run('https://example.com/test.mp3', 10.5);

// Test select
const select = db.prepare('SELECT * FROM AudioRecords WHERE url = ?');
const record = select.get('https://example.com/test.mp3');
console.log("Test record:", record);

db.close();
