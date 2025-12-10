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

export interface EERRLine {
  label: string;
  code?: string;
  amount: number;
  details?: {
    accountCode: string;
    accountName: string;
    amount: number;
  }[];
  type: 'income' | 'expense' | 'calculated';
  level?: number; // 1 for subtotals, 2 for final result
  verticalAnalysis?: number; // % of Ingresos Operacionales
  horizontalAnalysis?: {
    variationAbsolute: number;
    variationPercentage: number;
    comparisonMonth: string | null;
  };
}

export interface EERRData {
  lines: {
    ingresosOperacionales: EERRLine;
    costoVentas: EERRLine;
    margenBruto: EERRLine;
    gastosAdmin: EERRLine;
    depreciacion: EERRLine;
    resultadoOperacional: EERRLine;
    ingresosNoOperacionales: EERRLine;
    gastosNoOperacionales: EERRLine;
    correccionMonetaria: EERRLine;
    resultadoAntesImpuestos: EERRLine;
    impuestoRenta: EERRLine;
    utilidadPerdida: EERRLine;
  };
  summary: {
    ingresosOperacionales: number;
    costoVentas: number;
    margenBruto: number;
    margenBrutoPercentage: number;
    gastosAdmin: number;
    depreciacion: number;
    resultadoOperacional: number;
    ingresosNoOperacionales: number;
    gastosNoOperacionales: number;
    correccionMonetaria: number;
    resultadoAntesImpuestos: number;
    impuestoRenta: number;
    utilidadPerdida: number;
    margenNetoPercentage: number;
  };
}

export interface EERRResponse {
  success: boolean;
  data?: { [month: string]: EERRData };
  year?: string;
  availableYears?: string[];
  monthsAvailable?: string[];
  error?: string;
}

// ============================================
// FLUJO DE CAJA (CASH FLOW) TYPES
// ============================================

export interface CashFlowWorkingCapitalChanges {
  cuentasPorCobrar: {
    mesActual: number;
    mesAnterior: number;
    cambio: number; // Negativo si aumenta (dinero no cobrado)
  };
  inventarios: {
    mesActual: number;
    mesAnterior: number;
    cambio: number; // Negativo si aumenta (dinero invertido)
  };
  cuentasPorPagar: {
    mesActual: number;
    mesAnterior: number;
    cambio: number; // Positivo si aumenta (dinero no pagado)
  };
  total: number;
}

export interface CashFlowOperating {
  utilidadNeta: number;
  ajustesNoMonetarios: {
    depreciacion: number;
    otros: number;
    total: number;
  };
  cambiosCapitalTrabajo: CashFlowWorkingCapitalChanges;
  total: number;
}

export interface CashFlowInvestment {
  activosFijosIniciales: number;
  activosFijosFinales: number;
  depreciacionPeriodo: number;
  comprasNetasEstimadas: number; // Negativo = compra, Positivo = venta
  total: number;
}

export interface CashFlowFinancing {
  deudasLargoPlazoIniciales: number;
  deudasLargoPlazoFinales: number;
  cambioDeudas: number; // Positivo = préstamo, Negativo = pago
  patrimonioInicial: number;
  patrimonioFinal: number;
  cambioPatrimonio: number; // Ajustado por utilidad
  total: number;
}

export interface CashFlowIndicators {
  margenFlujoOperativo: number; // FCO / Ingresos * 100
  calidadIngresos: number; // FCO / Utilidad Neta * 100
  coberturaInversion?: number; // FCO / |FCI|
  diasEfectivoDisponible?: number; // Saldo / Gastos diarios
}

export interface CashFlowData {
  period: string; // "2025-01"
  periodName: string; // "Enero 2025"
  year: number;
  month: number;
  
  // FLUJO OPERATIVO (Fase 1)
  operatingCashFlow: CashFlowOperating;
  
  // FLUJO DE INVERSIÓN (Fase 3)
  investmentCashFlow?: CashFlowInvestment;
  
  // FLUJO DE FINANCIACIÓN (Fase 3)
  financingCashFlow?: CashFlowFinancing;
  
  // RESUMEN
  flujoNetoTotal: number;
  saldoEfectivoInicial?: number;
  saldoEfectivoFinal?: number;
  
  // INDICADORES
  indicadores: CashFlowIndicators;
  
  // DATOS DE ORIGEN
  ingresosOperacionales: number;
  
  // METADATA
  hasCompletePreviousMonth: boolean; // Si tiene datos del mes anterior para comparar
  warnings?: string[]; // Advertencias sobre datos faltantes o estimados
}

export interface CashFlowResponse {
  success: boolean;
  data?: CashFlowData;
  error?: string;
  message?: string;
}

export interface CashFlowMultipleResponse {
  success: boolean;
  data?: { [month: string]: CashFlowData };
  year?: string;
  availableMonths?: string[];
  error?: string;
}
