import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

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

// Execute Python script locally
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

    // Validar que tenemos el token de GitHub
    const githubToken = process.env.GITHUB_TOKEN
    
    // Si no hay GitHub token, ejecutar localmente
    if (!githubToken) {
      console.log('[DEBUG] No GitHub token found, executing Python script locally')
      return await executeLocalPython(date, endpoints)
    }

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
      throw new Error(`Failed to trigger GitHub Actions: ${workflowResponse.status} ${errorText}`)
    }

    console.log('[DEBUG] GitHub Actions workflow triggered successfully')

    return NextResponse.json({
      success: true,
      message: 'GitHub Actions workflow triggered successfully',
      details: {
        date,
        endpoints,
        note: 'Check GitHub Actions for progress and results'
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
