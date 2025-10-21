export interface BalanceRecord {
  _id: string;
  date: string;
  endpointType: string;
  recordCount: number;
  insertedAt: string;
  data: BalanceData[];
}

export interface BalanceData {
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  balance?: number;
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
