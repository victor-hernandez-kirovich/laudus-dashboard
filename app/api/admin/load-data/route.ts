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

export async function POST(request: NextRequest) {
  try {
    // Check if running in production (Vercel)
    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin data loading is only available in local development',
          message: 'Use the automated GitHub Actions workflow for production data loading'
        },
        { status: 403 }
      )
    }

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

    // Map endpoint names to Python script format
    const endpointMap: { [key: string]: string } = {
      'totals': 'totals',
      'standard': 'standard',
      '8Columns': '8columns'
    }

    const pythonEndpoints = endpoints
      .map(ep => endpointMap[ep])
      .filter(Boolean)

    if (pythonEndpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid endpoints specified' },
        { status: 400 }
      )
    }

    // Path to Python script (adjust based on your deployment)
    const scriptPath = path.join(process.cwd(), '..', 'laudus-api', 'scripts', 'fetch_balancesheet_manual.py')
    
    // Construct Python command
    const pythonCmd = `python "${scriptPath}" --date ${date} --endpoints ${pythonEndpoints.join(' ')}`

    console.log(`[DEBUG] Executing: ${pythonCmd}`)

    // Execute Python script
    const { stdout, stderr } = await execPromise(pythonCmd, {
      env: {
        ...process.env,
        LAUDUS_API_URL: process.env.LAUDUS_API_URL || 'https://api.laudus.cl',
        LAUDUS_USERNAME: process.env.LAUDUS_USERNAME || 'API',
        LAUDUS_PASSWORD: process.env.LAUDUS_PASSWORD || '',
        LAUDUS_COMPANY_VAT: process.env.LAUDUS_COMPANY_VAT || '',
        MONGODB_URI: process.env.MONGODB_URI || '',
        MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'laudus_data'
      },
      timeout: 900000 // 15 minutes
    })

    console.log('[DEBUG] Python stdout:', stdout)
    if (stderr) {
      console.log('[DEBUG] Python stderr:', stderr)
    }

    // Parse JSON result from Python script
    const jsonMatch = stdout.match(/__RESULT_JSON__[\s\S]*?\n(.+)/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Python script output')
    }

    const result = JSON.parse(jsonMatch[1])

    // Map results back to original endpoint names
    const reverseMap: { [key: string]: string } = {
      'totals': 'totals',
      'standard': 'standard',
      '8Columns': '8Columns'
    }

    const mappedResults = result.results.map((r: any) => ({
      ...r,
      endpoint: reverseMap[r.endpoint] || r.endpoint
    }))

    const successCount = mappedResults.filter((r: any) => r.success).length
    const totalCount = mappedResults.length

    return NextResponse.json({
      success: result.success,
      results: mappedResults,
      message: result.success
        ? `Successfully loaded ${successCount}/${totalCount} endpoints`
        : `Loaded ${successCount}/${totalCount} endpoints with errors`
    })

  } catch (error: any) {
    console.error('Error in load-data API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: error.stderr || ''
      },
      { status: 500 }
    )
  }
}
