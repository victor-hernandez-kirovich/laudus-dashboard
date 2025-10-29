import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    
    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection('invoices_by_branch')
    
    let query = {}
    
    if (month) {
      // Single month query
      query = { month }
    } else if (startMonth && endMonth) {
      // Range query
      query = {
        month: {
          $gte: startMonth,
          $lte: endMonth
        }
      }
    }
    
    const data = await collection
      .find(query)
      .sort({ month: -1 })
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
