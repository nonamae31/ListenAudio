import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const db = getDb();
    const record = db.prepare('SELECT lastPosition FROM AudioRecords WHERE url = ?').get(url);
    
    if (!record) {
      return NextResponse.json({ lastPosition: 0 }); // Không thấy thì coi như 0
    }
    
    return NextResponse.json(record);
  } catch (error) {
    console.error('Lỗi lấy trạng thái audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { url, lastPosition } = await request.json();
    if (!url || typeof lastPosition !== 'number') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare('UPDATE AudioRecords SET lastPosition = ?, updatedAt = CURRENT_TIMESTAMP WHERE url = ?');
    const result = stmt.run(lastPosition, url);
    
    if (result.changes === 0) {
      // Có thể record chưa có do chưa gọi POST, tự động thêm
      db.prepare('INSERT INTO AudioRecords (url, lastPosition) VALUES (?, ?)').run(url, lastPosition);
    }

    return NextResponse.json({ success: true, url, lastPosition }, { status: 200 });
  } catch (error) {
    console.error('Lỗi lưu trạng thái audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
