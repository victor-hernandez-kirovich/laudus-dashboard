export interface BalanceRecord {
  _id: string;
  date: string;
  endpointType: string;
  recordCount: number;
  insertedAt: string;
  data: BalanceData[];
}

export interface BalanceData {
  // Campos originales de Laudus
  accountId?: number;
  accountNumber?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  balance?: number;
  debitBalance?: number;
  creditBalance?: number;
  
  // Campos específicos de 8Columns
  assets?: number;
  liabilities?: number;
  expenses?: number;
  incomes?: number;
  
  // Campos normalizados (agregados por helper)
  accountCode?: string;
  
  level?: number;
  [key: string]: any;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface InvoicesBySalesmanData {
  month: string;
  year: number;
  monthNumber: number;
  monthName: string;
  salesmanId: number;
  salesmanName: string;
  net: number;
  netPercentage: number;
  comissions: number;
  margin: number;
  marginPercentage: number;
  discounts: number;
  discountsPercentage: number;
  numberOfDocuments: number;
  averageTicket: number;
  insertedAt: string;
}

export interface LoadDataJobStatus {
  _id?: string;
  jobId: string;
  date: string;
  endpoints: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  mode: 'github-actions' | 'local-execution' | 'local-execution-async';
  startedAt: string;
  completedAt?: string;
  results: {
    endpoint: string;
    status: 'pending' | 'success' | 'error';
    records?: number;
    error?: string;
    detectedAt?: string;
  }[];
  logs: string[];
  actionUrl?: string;
  workflowName?: string;
  error?: string;
}

export interface LoadDataJobStatusResponse {
  success: boolean;
  job?: LoadDataJobStatus;
  error?: string;
}
