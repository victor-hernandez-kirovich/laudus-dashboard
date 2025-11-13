import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const db = await getDatabase();
    const collection = db.collection('balance_totals');
    
    let query: any = {};
    if (date) {
      query._id = { $regex: `^${date}` };
    }
    
    const data = await collection
      .find(query)
      .sort({ date: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });
    
  } catch (error: any) {
    console.error('Error fetching totals:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
