import { NextResponse } from 'next/server';
import { connectToDb, AudioRecord } from '@/lib/db';

export async function GET() {
  try {
    await connectToDb();
    const records = await AudioRecord.find().sort({ updatedAt: -1 }).lean();
    
    // Map _id to id for backwards compatibility with frontend
    const mapped = records.map((r: any) => ({
      ...r,
      id: r._id.toString()
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Lỗi lấy danh sách audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    await connectToDb();
    
    let record = await AudioRecord.findOne({ url });
    if (!record) {
      record = await AudioRecord.create({ url, lastPosition: 0 });
    }

    return NextResponse.json({ ...record.toObject(), id: record._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Lỗi thêm audio mới:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    await connectToDb();
    const result = await AudioRecord.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch (error) {
    console.error('Lỗi xoá audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
