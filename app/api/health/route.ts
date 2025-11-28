import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get latest record from 8 columns collection
    const columns8 = await db.collection('balance_8columns').findOne({}, { sort: { date: -1 } });
    
    return NextResponse.json({
      success: true,
      healthy: true,
      collections: {
        balance_8columns: {
          lastUpdate: columns8?.insertedAt,
          recordCount: columns8?.recordCount || 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        healthy: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}
