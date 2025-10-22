/**
 * Laudus API Client
 * TypeScript client for interacting with Laudus ERP API
 */

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
    name: 'totals',
    path: '/accounting/balanceSheet/totals',
    collection: 'balance_totals'
  },
  {
    name: 'standard',
    path: '/accounting/balanceSheet/standard',
    collection: 'balance_standard'
  },
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

  constructor(config: LaudusConfig) {
    this.baseUrl = config.apiUrl
    this.config = config
  }

  /**
   * Authenticate with Laudus API and get JWT token
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/security/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userName: this.config.username,
          password: this.config.password,
          companyVATId: this.config.companyVat
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const tokenText = await response.text()
      this.token = tokenText.replace(/^"(.*)"$/, '$1') // Remove quotes

      return true
    } catch (error) {
      console.error('Authentication error:', error)
      return false
    }
  }

  /**
   * Fetch balance sheet data from specified endpoint
   */
  async fetchBalanceSheet(endpoint: LaudusEndpoint, dateTo: string): Promise<any[] | null> {
    try {
      if (!this.token) {
        throw new Error('Not authenticated. Call authenticate() first.')
      }

      const params = new URLSearchParams({
        dateTo: dateTo,
        showAccountsWithZeroBalance: 'true',
        showOnlyAccountsWithActivity: 'false'
      })

      const url = `${this.baseUrl}${endpoint.path}?${params}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint.name}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching ${endpoint.name}:`, error)
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
