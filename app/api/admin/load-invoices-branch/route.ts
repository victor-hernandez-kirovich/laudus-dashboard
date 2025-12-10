import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import clientPromise from '@/lib/mongodb'

interface LoadInvoicesRequest {
  year: number
  month: number
}

interface LoadInvoicesJobStatus {
  jobId: string
  year: number
  month: number
  period: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  mode: 'local-execution-async'
  startedAt: string
  completedAt?: string
  error?: string
  records?: number
  logs: string[]
}

// Execute Python script locally in background
async function executeLocalPythonAsync(
  year: number,
  month: number,
  jobId: string
): Promise<NextResponse> {
  try {
    // Path to Python script in laudus-api repo (sibling directory)
    const apiPath = path.join(process.cwd(), '..', 'laudus-api')
    const scriptPath = path.join(apiPath, 'scripts', 'fetch_invoices_by_branch.py')

    // Execute Python in background using spawn
    const pythonProcess = spawn('python', [
      scriptPath,
      '--year', year.toString(),
      '--month', month.toString()
    ], {
      cwd: apiPath,
      detached: false,
      stdio: 'ignore'
    })

    pythonProcess.unref()

    const period = `${year}-${month.toString().padStart(2, '0')}`

    return NextResponse.json({
      success: true,
      mode: 'local-execution-async',
      jobId,
      message: 'Python script started in background',
      details: {
        year,
        month,
        period,
        note: 'El proceso está ejecutándose en segundo plano. El sistema monitoreará automáticamente el progreso.'
      }
    })

  } catch (error: any) {
    console.error('[ERROR] Failed to start Python script:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start Python script locally'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LoadInvoicesRequest = await request.json()
    const { year, month } = body

    // Validate year
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json(
        { success: false, error: 'Año inválido. Debe estar entre 2000 y 2100' },
        { status: 400 }
      )
    }

    // Validate month
    if (!month || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Mes inválido. Debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    // Validate not future date
    const now = new Date()
    const targetDate = new Date(year, month - 1, 1)
    if (targetDate > now) {
      return NextResponse.json(
        { success: false, error: 'No se puede cargar datos de fechas futuras' },
        { status: 400 }
      )
    }

    const period = `${year}-${month.toString().padStart(2, '0')}`
    const jobId = `invoices-branch_${period}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Connect to MongoDB and create initial job record
    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadInvoicesJobStatus>('load_invoices_status')

    const jobStatus: LoadInvoicesJobStatus = {
      jobId,
      year,
      month,
      period,
      status: 'running',
      mode: 'local-execution-async',
      startedAt: new Date().toISOString(),
      logs: [
        `[${new Date().toLocaleTimeString('es-CL')}] 📅 Iniciando carga de facturas por sucursal para ${period}`,
        `[${new Date().toLocaleTimeString('es-CL')}] 🔐 Ejecutando localmente en segundo plano`
      ]
    }

    await collection.insertOne(jobStatus)

    const response = await executeLocalPythonAsync(year, month, jobId)
    return response

  } catch (error: any) {
    console.error('Error in load-invoices-branch API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const period = searchParams.get('period')

    const client = await clientPromise
    const db = client.db('laudus_data')

    // If jobId provided, get specific job status
    if (jobId) {
      const collection = db.collection<LoadInvoicesJobStatus>('load_invoices_status')
      const job = await collection.findOne({ jobId })

      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, job })
    }

    // If period provided, check if data exists
    if (period) {
      const dataCollection = db.collection('invoices_by_branch')
      const data = await dataCollection.findOne({ period: period })

      return NextResponse.json({
        success: true,
        dataExists: !!data,
        records: data?.recordCount || 0,
        lastUpdated: data?.insertedAt || null
      })
    }

    // Return recent jobs
    const collection = db.collection<LoadInvoicesJobStatus>('load_invoices_status')
    const jobs = await collection
      .find({ jobId: { $regex: /^invoices-branch/ } })
      .sort({ startedAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({ success: true, jobs })

  } catch (error: any) {
    console.error('Error in load-invoices-branch GET:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
