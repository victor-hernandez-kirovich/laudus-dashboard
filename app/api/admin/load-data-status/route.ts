import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { LoadDataJobStatus } from '@/lib/types'

/**
 * GET /api/admin/load-data-status?jobId=xxx
 * Obtiene el estado de un trabajo de carga de datos
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadDataJobStatus>('load_data_status')

    const job = await collection.findOne({ jobId })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job
    })

  } catch (error: any) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/load-data-status
 * Crea o actualiza el estado de un trabajo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, ...updates } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadDataJobStatus>('load_data_status')

    // Upsert: crear si no existe, actualizar si existe
    const result = await collection.updateOne(
      { jobId },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    // Obtener el documento actualizado
    const job = await collection.findOne({ jobId })

    return NextResponse.json({
      success: true,
      job,
      upserted: result.upsertedCount > 0
    })

  } catch (error: any) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/load-data-status?jobId=xxx
 * Elimina el estado de un trabajo (útil para limpiar trabajos antiguos)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadDataJobStatus>('load_data_status')

    const result = await collection.deleteOne({ jobId })

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0
    })

  } catch (error: any) {
    console.error('Error deleting job status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
