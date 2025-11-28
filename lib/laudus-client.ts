/**
 * Laudus API Client
 * TypeScript client for interacting with Laudus ERP API
 */

import axios, { AxiosInstance } from 'axios'

export interface LaudusConfig {
  apiUrl: string
  username: string
  password: string
  companyVat: string
}

export interface LaudusEndpoint {
  name: string
  path: string
  collection: string
}

export const LAUDUS_ENDPOINTS: LaudusEndpoint[] = [
  {
    name: '8Columns',
    path: '/accounting/balanceSheet/8Columns',
    collection: 'balance_8columns'
  }
]

export class LaudusAPIClient {
  private baseUrl: string
  private token: string | null = null
  private config: LaudusConfig
  private axiosInstance: AxiosInstance

  constructor(config: LaudusConfig) {
    this.baseUrl = config.apiUrl
    this.config = config
    
    // Create axios instance similar to Python's requests.Session()
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: 900000,  // 15 minutes (same as Python: 900 seconds)
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Authenticate with Laudus API and get JWT token
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/security/login', {
        userName: this.config.username,
        password: this.config.password,
        companyVATId: this.config.companyVat
      })
      
      // Parse JSON response to extract token
      this.token = response.data.token
      
      if (this.token) {
        // Update axios instance headers with token (like Python's session.headers.update)
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      }

      return true
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Authentication error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
      } else {
        console.error('Authentication error:', error)
      }
      return false
    }
  }

  /**
   * Fetch balance sheet data from specified endpoint
   */
  async fetchBalanceSheet(endpoint: LaudusEndpoint, dateTo: string): Promise<any[] | null> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.')
    }
    
    try {
      const response = await this.axiosInstance.get(endpoint.path, {
        params: {
          dateTo: dateTo,
          showAccountsWithZeroBalance: 'true',
          showOnlyAccountsWithActivity: 'false'
        }
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error(`Timeout fetching ${endpoint.name} (>15 minutes)`)
        } else {
          console.error(`Error fetching ${endpoint.name}:`, error.message)
        }
      } else {
        console.error(`Error fetching ${endpoint.name}:`, error)
      }
      return null
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token
  }
}



