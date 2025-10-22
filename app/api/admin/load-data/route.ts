import { NextRequest, NextResponse } from 'next/server'

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
    if (!githubToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub token not configured',
          message: 'Please add GITHUB_TOKEN to environment variables'
        },
        { status: 500 }
      )
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
