import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import clientPromise from '@/lib/mongodb'
import { LoadDataJobStatus } from '@/lib/types'

interface LoadInvoicesRequest {
  year: number
  month: number
}

// Execute Python script locally in background
async function executeLocalPythonAsync(year: number, month: number, jobId: string): Promise<NextResponse> {
  try {
    const apiPath = path.join(process.cwd(), '..', 'laudus-api')
    const scriptPath = path.join(apiPath, 'scripts', 'fetch_invoices_by_salesman.py')

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

    return NextResponse.json({
      success: true,
      mode: 'local-execution-async',
      jobId,
      message: 'Python script started in background',
      details: {
        year,
        month,
        note: 'El proceso está ejecutándose en segundo plano.'
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

    // Validar año y mes
    if (!year || year < 2020 || year > 2030) {
      return NextResponse.json(
        { success: false, error: 'Año inválido (debe estar entre 2020 y 2030)' },
        { status: 400 }
      )
    }

    if (!month || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Mes inválido (debe estar entre 1 y 12)' },
        { status: 400 }
      )
    }

    // Generar jobId único
    const jobId = `invoices_salesman_${year}_${month}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Conectar a MongoDB
    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadDataJobStatus>('load_data_status')

    const jobStatus: LoadDataJobStatus = {
      jobId,
      date: `${year}-${month.toString().padStart(2, '0')}-01`,
      endpoints: ['invoices_by_salesman'],
      status: 'pending',
      mode: 'github-actions',
      startedAt: new Date().toISOString(),
      results: [{
        endpoint: 'invoices_by_salesman',
        status: 'pending'
      }],
      logs: [
        `[${new Date().toLocaleTimeString('es-CL')}] 📅 Iniciando carga de facturas por vendedor para ${year}-${month.toString().padStart(2, '0')}`,
      ]
    }

    // Verificar si hay GitHub token
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      // Ejecución local
      jobStatus.mode = 'local-execution-async'
      jobStatus.status = 'running'
      jobStatus.logs.push(`[${new Date().toLocaleTimeString('es-CL')}] 🔐 Ejecutando localmente en segundo plano`)

      await collection.insertOne(jobStatus)

      return await executeLocalPythonAsync(year, month, jobId)
    }

    // Disparar GitHub Actions workflow
    const workflowResponse = await fetch(
      'https://api.github.com/repos/victor-hernandez-kirovich/laudus-api/actions/workflows/laudus-invoices-salesman.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            year: year.toString(),
            month: month.toString()
          }
        })
      }
    )

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text()
      console.error('[DEBUG] GitHub API error:', errorText)

      await collection.updateOne(
        { jobId },
        {
          $set: {
            status: 'failed',
            error: `Failed to trigger GitHub Actions: ${workflowResponse.status}`,
            completedAt: new Date().toISOString()
          },
          $push: {
            logs: `[${new Date().toLocaleTimeString('es-CL')}] ❌ Error: ${errorText}`
          } as any
        }
      )

      throw new Error(`Failed to trigger GitHub Actions: ${workflowResponse.status} ${errorText}`)
    }

    // Actualizar job status
    jobStatus.mode = 'github-actions'
    jobStatus.status = 'running'
    jobStatus.actionUrl = 'https://github.com/victor-hernandez-kirovich/laudus-api/actions'
    jobStatus.workflowName = 'Laudus Invoices By Salesman'
    jobStatus.logs.push(
      `[${new Date().toLocaleTimeString('es-CL')}] ✅ Workflow de GitHub Actions disparado exitosamente`,
      `[${new Date().toLocaleTimeString('es-CL')}] 🔗 Ver progreso: ${jobStatus.actionUrl}`
    )

    await collection.insertOne(jobStatus)

    return NextResponse.json({
      success: true,
      jobId,
      message: 'GitHub Actions workflow triggered successfully',
      mode: 'github-actions',
      actionUrl: jobStatus.actionUrl,
      workflowName: jobStatus.workflowName,
      details: {
        year,
        month,
        note: 'El proceso está ejecutándose en GitHub Actions.'
      }
    })

  } catch (error: any) {
    console.error('Error in load-invoices-salesman API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
