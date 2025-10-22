import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { LaudusAPIClient, LAUDUS_ENDPOINTS } from '@/lib/laudus-client'

// Configuración de Laudus desde variables de entorno
const LAUDUS_CONFIG = {
  apiUrl: process.env.LAUDUS_API_URL || 'https://api.laudus.cl',
  username: process.env.LAUDUS_USERNAME || 'API',
  password: process.env.LAUDUS_PASSWORD || '',
  companyVat: process.env.LAUDUS_COMPANY_VAT || ''
}

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
    // Validar configuración
    if (!LAUDUS_CONFIG.password || !LAUDUS_CONFIG.companyVat) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Laudus API credentials in environment variables' 
        },
        { status: 500 }
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

    // Filtrar solo endpoints válidos
    const validEndpoints = LAUDUS_ENDPOINTS.filter(e => endpoints.includes(e.name))
    
    if (validEndpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid endpoints specified' },
        { status: 400 }
      )
    }

    // Inicializar cliente de Laudus
    const laudusClient = new LaudusAPIClient(LAUDUS_CONFIG)
    
    // Autenticar
    const authenticated = await laudusClient.authenticate()
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Failed to authenticate with Laudus API' },
        { status: 401 }
      )
    }

    // Conectar a MongoDB
    const db = await getDatabase()

    // Resultados
    const results: LoadDataResponse['results'] = []

    // Procesar cada endpoint
    for (const endpoint of validEndpoints) {
      try {
        // Fetch datos de Laudus
        const data = await laudusClient.fetchBalanceSheet(endpoint, date)

        if (!data) {
          results.push({
            endpoint: endpoint.name,
            success: false,
            error: 'Failed to fetch data from Laudus API'
          })
          continue
        }

        // Guardar en MongoDB
        const collection = db.collection(endpoint.collection)
        
        const document = {
          _id: `${date}-${endpoint.name}`,
          date: date,
          endpointType: endpoint.name,
          recordCount: data.length,
          insertedAt: new Date(),
          data: data
        }

        // Upsert (reemplazar si existe, insertar si no)
        await collection.replaceOne(
          { _id: document._id } as any,
          document,
          { upsert: true }
        )

        results.push({
          endpoint: endpoint.name,
          success: true,
          records: data.length
        })

      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Verificar si todos fueron exitosos
    const allSuccess = results.every(r => r.success)
    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess 
        ? `Successfully loaded ${successCount}/${validEndpoints.length} endpoints`
        : `Loaded ${successCount}/${validEndpoints.length} endpoints with errors`
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
