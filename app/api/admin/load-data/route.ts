import { NextRequest, NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import clientPromise from '@/lib/mongodb'
import { LoadDataJobStatus } from '@/lib/types'

const execPromise = promisify(exec)

interface LoadDataRequest {
  date: string
  endpoints: string[]
}

interface LoadDataResponse {
  success: boolean
  results: {
    endpoint: string
    success: boolean
    records?: number
    error?: string
  }[]
  message: string
}

// Execute Python script locally in background
async function executeLocalPythonAsync(date: string, endpoints: string[], jobId: string): Promise<NextResponse> {
  try {
    // Path to Python script in laudus-api repo (sibling directory)
    const apiPath = path.join(process.cwd(), '..', 'laudus-api')
    const scriptPath = path.join(apiPath, 'scripts', 'fetch_balancesheet_manual.py')
    
    // Map endpoint names
    const endpointMap: { [key: string]: string } = {
      'totals': 'totals',
      'standard': 'standard',
      '8Columns': '8columns'
    }
    
    const mappedEndpoints = endpoints
      .map(ep => endpointMap[ep])
      .filter(Boolean)
      .join(' ')
    
    console.log('[INFO] Starting Python script in background...')
    console.log('[INFO] Script:', scriptPath)
    console.log('[INFO] Date:', date, 'Endpoints:', mappedEndpoints)
    console.log('[INFO] Job ID:', jobId)
    
    // Execute Python in background using spawn (no esperar)
    const pythonProcess = spawn('python', [
      scriptPath,
      '--date', date,
      '--endpoints', ...mappedEndpoints.split(' ')
    ], {
      cwd: apiPath,
      detached: false,
      stdio: 'ignore' // Ignora stdout/stderr para no bloquear
    })
    
    // No esperamos a que termine
    pythonProcess.unref() // Permite que el proceso continúe en segundo plano
    
    console.log('[INFO] Python script started with PID:', pythonProcess.pid)
    console.log('[INFO] Process will run in background, client should poll for results')
    
    return NextResponse.json({
      success: true,
      mode: 'local-execution-async',
      jobId,
      message: 'Python script started in background',
      details: {
        date,
        endpoints,
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

// Execute Python script locally (legacy - synchronous)
async function executeLocalPython(date: string, endpoints: string[]): Promise<NextResponse> {
  try {
    // Path to Python script in laudus-api repo (sibling directory)
    const apiPath = path.join(process.cwd(), '..', 'laudus-api')
    const scriptPath = path.join(apiPath, 'scripts', 'fetch_balancesheet_manual.py')
    
    // Map endpoint names
    const endpointMap: { [key: string]: string } = {
      'totals': 'totals',
      'standard': 'standard',
      '8Columns': '8columns'
    }
    
    const mappedEndpoints = endpoints
      .map(ep => endpointMap[ep])
      .filter(Boolean)
      .join(' ')
    
    const command = `python "${scriptPath}" --date ${date} --endpoints ${mappedEndpoints}`
    
    console.log('[DEBUG] Executing:', command)
    
    const { stdout, stderr } = await execPromise(command, {
      cwd: apiPath,
      timeout: 3600000, // 1 hour timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })
    
    console.log('[DEBUG] Python stdout:', stdout)
    if (stderr) console.error('[DEBUG] Python stderr:', stderr)
    
    // Parse JSON output from Python script
    const jsonStartIndex = stdout.indexOf('__RESULT_JSON__')
    if (jsonStartIndex === -1) {
      throw new Error('Could not find JSON output marker in Python output')
    }
    
    const jsonString = stdout.substring(jsonStartIndex + '__RESULT_JSON__'.length).trim()
    const result = JSON.parse(jsonString)
    
    return NextResponse.json({
      success: result.success,
      results: result.results,
      mode: 'local-execution',
      message: result.success 
        ? 'Data loaded successfully' 
        : 'Some endpoints failed to load'
    })
    
  } catch (error: any) {
    console.error('[DEBUG] Local Python execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute Python script locally'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: LoadDataRequest = await request.json()
    const { date, endpoints } = body

    // Validar fecha
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validar que la fecha no sea futura
    const targetDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (targetDate > today) {
      return NextResponse.json(
        { success: false, error: 'Cannot load data from future dates' },
        { status: 400 }
      )
    }

    // Validar endpoints
    if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No endpoints specified' },
        { status: 400 }
      )
    }

    // Generar un jobId único
    const jobId = `job_${date}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Conectar a MongoDB y crear el registro inicial del job
    const client = await clientPromise
    const db = client.db('laudus_data')
    const collection = db.collection<LoadDataJobStatus>('load_data_status')

    const jobStatus: LoadDataJobStatus = {
      jobId,
      date,
      endpoints,
      status: 'pending',
      mode: 'github-actions', // Se actualizará según el modo real
      startedAt: new Date().toISOString(),
      results: endpoints.map(endpoint => ({
        endpoint,
        status: 'pending'
      })),
      logs: [
        `[${new Date().toLocaleTimeString('es-CL')}] 📅 Iniciando carga de datos para ${date}`,
        `[${new Date().toLocaleTimeString('es-CL')}] 📊 Endpoints seleccionados: ${endpoints.join(', ')}`
      ]
    }

    // Validar que tenemos el token de GitHub
    const githubToken = process.env.GITHUB_TOKEN
    
    // Si no hay GitHub token, ejecutar localmente en segundo plano
    if (!githubToken) {
      console.log('[INFO] No GitHub token found, executing Python script locally in background')
      
      jobStatus.mode = 'local-execution-async'
      jobStatus.status = 'running'
      jobStatus.logs.push(`[${new Date().toLocaleTimeString('es-CL')}] 🔐 Ejecutando localmente en segundo plano`)
      
      // Guardar job status en MongoDB
      await collection.insertOne(jobStatus)
      
      const response = await executeLocalPythonAsync(date, endpoints, jobId)
      return response
    }
    
    console.log('[INFO] GitHub token found, triggering GitHub Actions workflow')

    // Map endpoint names to GitHub Actions format
    const endpointMap: { [key: string]: string } = {
      'totals': 'totals',
      'standard': 'standard',
      '8Columns': '8columns'
    }

    const githubEndpoints = endpoints
      .map(ep => endpointMap[ep])
      .filter(Boolean)
      .join(',')

    if (!githubEndpoints) {
      return NextResponse.json(
        { success: false, error: 'No valid endpoints specified' },
        { status: 400 }
      )
    }

    console.log(`[DEBUG] Triggering GitHub Actions workflow with date=${date} and endpoints=${githubEndpoints}`)

    // Disparar GitHub Actions workflow
    const workflowResponse = await fetch(
      'https://api.github.com/repos/victor-hernandez-kirovich/laudus-api/actions/workflows/laudus-manual.yml/dispatches',
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
            date: date,
            endpoints: githubEndpoints
          }
        })
      }
    )

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text()
      console.error('[DEBUG] GitHub API error:', errorText)
      
      // Actualizar job con error
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

    console.log('[DEBUG] GitHub Actions workflow triggered successfully')

    // Actualizar job status con información de GitHub Actions
    jobStatus.mode = 'github-actions'
    jobStatus.status = 'running'
    jobStatus.actionUrl = 'https://github.com/victor-hernandez-kirovich/laudus-api/actions'
    jobStatus.workflowName = 'Laudus Manual'
    jobStatus.logs.push(
      `[${new Date().toLocaleTimeString('es-CL')}] ✅ Workflow de GitHub Actions disparado exitosamente`,
      `[${new Date().toLocaleTimeString('es-CL')}] 🔗 Ver progreso: ${jobStatus.actionUrl}`
    )
    
    // Guardar en MongoDB
    await collection.insertOne(jobStatus)

    return NextResponse.json({
      success: true,
      jobId,
      message: 'GitHub Actions workflow triggered successfully',
      mode: 'github-actions',
      actionUrl: jobStatus.actionUrl,
      workflowName: jobStatus.workflowName,
      details: {
        date,
        endpoints,
        note: 'El proceso está ejecutándose en GitHub Actions. Abre el enlace para ver el progreso en tiempo real.'
      }
    })

  } catch (error: any) {
    console.error('Error in load-data API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

