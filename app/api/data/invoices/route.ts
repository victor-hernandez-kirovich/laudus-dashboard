import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')

    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection('invoices_by_month')

    let query = {}

    // Single month query
    if (month) {
      query = { month }
    }
    // Range query
    else if (startMonth && endMonth) {
      query = {
        month: {
          $gte: startMonth,
          $lte: endMonth
        }
      }
    }

    // Fetch data sorted by month descending (most recent first)
    const invoices = await collection
      .find(query)
      .sort({ month: -1 })
      .toArray()

    // Transform data for frontend
    const data = invoices.map(invoice => ({
      month: invoice.month,
      year: invoice.year,
      monthNumber: invoice.monthNumber,
      monthName: invoice.monthName,
      total: invoice.total,
      returns: invoice.returns,
      returnsPercentage: invoice.returnsPercentage,
      net: invoice.net,
      netChangeYoYPercentage: invoice.netChangeYoYPercentage,
      margin: invoice.margin,
      marginChangeYoYPercentage: invoice.marginChangeYoYPercentage,
      discounts: invoice.discounts,
      discountsPercentage: invoice.discountsPercentage,
      quantity: invoice.quantity,
      insertedAt: invoice.insertedAt
    }))

    return NextResponse.json({
      success: true,
      count: data.length,
      data
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch invoices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
