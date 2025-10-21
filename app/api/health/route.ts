import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get latest record from each collection
    const [totals, standard, columns8] = await Promise.all([
      db.collection('balance_totals').findOne({}, { sort: { date: -1 } }),
      db.collection('balance_standard').findOne({}, { sort: { date: -1 } }),
      db.collection('balance_8columns').findOne({}, { sort: { date: -1 } })
    ]);
    
    return NextResponse.json({
      success: true,
      healthy: true,
      collections: {
        balance_totals: {
          lastUpdate: totals?.insertedAt,
          recordCount: totals?.recordCount || 0
        },
        balance_standard: {
          lastUpdate: standard?.insertedAt,
          recordCount: standard?.recordCount || 0
        },
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
