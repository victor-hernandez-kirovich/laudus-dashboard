import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange')
    
    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection('invoices_by_branch')
    
    let query = {}
    
    if (dateRange) {
      query = { dateRange }
    }
    
    const data = await collection
      .find(query)
      .sort({ startDate: -1 })
      .limit(100)
      .toArray()
    
    return NextResponse.json({
      success: true,
      count: data.length,
      data
    })
  } catch (error) {
    console.error('Error fetching invoices by branch:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener datos de facturas por sucursal' 
      },
      { status: 500 }
    )
  }
}
