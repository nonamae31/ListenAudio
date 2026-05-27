import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Lấy danh sách tất cả audio
export async function GET() {
  try {
    const db = getDb();
    const records = db.prepare('SELECT * FROM AudioRecords ORDER BY updatedAt DESC').all();
    return NextResponse.json(records);
  } catch (error) {
    console.error('Lỗi lấy danh sách audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Thêm mới một URL audio
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare('INSERT INTO AudioRecords (url, lastPosition) VALUES (?, 0) ON CONFLICT(url) DO NOTHING');
    stmt.run(url);
    
    // Trả về record
    const record = db.prepare('SELECT * FROM AudioRecords WHERE url = ?').get(url);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Lỗi thêm audio mới:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
