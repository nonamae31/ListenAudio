import { NextResponse } from 'next/server';
import { connectToDb, AudioRecord } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    await connectToDb();
    const record = await AudioRecord.findOne({ url }, 'lastPosition').lean();
    
    if (!record) {
      return NextResponse.json({ lastPosition: 0 });
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

    await connectToDb();
    const result = await AudioRecord.findOneAndUpdate(
      { url },
      { lastPosition },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, url, lastPosition: result.lastPosition }, { status: 200 });
  } catch (error) {
    console.error('Lỗi lưu trạng thái audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
