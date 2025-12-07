/**
 * Cash Flow Utilities
 * Funciones helper para calcular el Flujo de Caja basado en datos de Balance y EERR
 */

import { BalanceData } from './types';

// ============================================
// CONSTANTES - CÓDIGOS DE CUENTAS
// ============================================

/**
 * Códigos de cuentas según plan contable estándar chileno
 * Basado en análisis del código existente
 */
export const ACCOUNT_CODES = {
  // ACTIVO CORRIENTE (11)
  ACTIVO_CORRIENTE: '11',
  EFECTIVO_BANCOS: '1101', // Caja y Bancos
  CUENTAS_POR_COBRAR: '1102', // Deudores por Ventas
  INVENTARIOS: '1109', // Existencias
  
  // ACTIVO NO CORRIENTE (12)
  ACTIVO_NO_CORRIENTE: '12',
  ACTIVOS_FIJOS: '12', // Todos los activos fijos
  
  // PASIVO CORRIENTE (21)
  PASIVO_CORRIENTE: '21',
  CUENTAS_POR_PAGAR: '2101', // Proveedores
  
  // PASIVO NO CORRIENTE (22)
  PASIVO_NO_CORRIENTE: '22',
  
  // PATRIMONIO (3)
  PATRIMONIO: '3',
} as const;

// ============================================
// FUNCIONES DE EXTRACCIÓN DE CUENTAS
// ============================================

/**
 * Extrae el valor de cuentas que coinciden con un código específico o prefijo
 */
export function extractAccountsByCode(
  balanceData: BalanceData[],
  codePrefix: string,
  useAssets: boolean = true
): number {
  if (!balanceData || balanceData.length === 0) return 0;

  let total = 0;
  
  for (const account of balanceData) {
    const accountNumber = account.accountNumber?.toString() || '';
    
    // Verificar si la cuenta coincide con el prefijo
    if (accountNumber.startsWith(codePrefix)) {
      const value = useAssets 
        ? (account.assets || 0) 
        : (account.liabilities || 0);
      
      total += parseFloat(value.toString()) || 0;
    }
  }
  
  return total;
}

/**
 * Obtiene el total de Efectivo y Bancos (Caja)
 * Código: 1101 o similar
 */
export function getEfectivoYBancos(balanceData: BalanceData[]): number {
  // Intentar primero con el código específico 1101
  let efectivo = extractAccountsByCode(balanceData, ACCOUNT_CODES.EFECTIVO_BANCOS, true);
  
  // Si no hay datos con 1101, buscar cualquier cuenta que empiece con 110
  if (efectivo === 0) {
    efectivo = extractAccountsByCode(balanceData, '110', true);
  }
  
  return efectivo;
}

/**
 * Obtiene el total de Cuentas por Cobrar
 * Código: 1102, 1103, o similar (Deudores por Ventas)
 */
export function getCuentasPorCobrar(balanceData: BalanceData[]): number {
  // Buscar cuentas que empiecen con 110 (después de efectivo)
  // Típicamente: 1102, 1103, 1104, etc.
  let cuentasPorCobrar = 0;
  
  // Estrategia: Sumar todas las cuentas 110X excepto 1101 (efectivo)
  for (const account of balanceData) {
    const accountNumber = account.accountNumber?.toString() || '';
    
    if (accountNumber.startsWith('110') && !accountNumber.startsWith('1101')) {
      const value = parseFloat((account.assets || 0).toString()) || 0;
      cuentasPorCobrar += value;
    }
  }
  
  // Si no encontramos con ese patrón, buscar explícitamente 1102
  if (cuentasPorCobrar === 0) {
    cuentasPorCobrar = extractAccountsByCode(balanceData, '1102', true);
  }
  
  return cuentasPorCobrar;
}

/**
 * Obtiene el total de Inventarios (Existencias)
 * Código: 1109 o similar
 */
export function getInventarios(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.INVENTARIOS, true);
}

/**
 * Obtiene el total de Cuentas por Pagar
 * Código: 2101, 2102, o similar (Proveedores)
 */
export function getCuentasPorPagar(balanceData: BalanceData[]): number {
  // Buscar cuentas que empiecen con 210
  let cuentasPorPagar = 0;
  
  for (const account of balanceData) {
    const accountNumber = account.accountNumber?.toString() || '';
    
    if (accountNumber.startsWith('210')) {
      const value = parseFloat((account.liabilities || 0).toString()) || 0;
      cuentasPorPagar += value;
    }
  }
  
  // Fallback: buscar código específico
  if (cuentasPorPagar === 0) {
    cuentasPorPagar = extractAccountsByCode(balanceData, ACCOUNT_CODES.CUENTAS_POR_PAGAR, false);
  }
  
  return cuentasPorPagar;
}

/**
 * Obtiene el total de Activos Fijos (No Corrientes)
 * Código: 12
 */
export function getActivosFijos(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.ACTIVO_NO_CORRIENTE, true);
}

/**
 * Obtiene el total de Activos Corrientes
 * Código: 11
 */
export function getActivosCorrientes(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.ACTIVO_CORRIENTE, true);
}

/**
 * Obtiene el total de Pasivos Corrientes
 * Código: 21
 */
export function getPasivosCorrientes(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.PASIVO_CORRIENTE, false);
}

/**
 * Obtiene el total de Pasivos No Corrientes (Deudas Largo Plazo)
 * Código: 22
 */
export function getDeudasLargoPlazo(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.PASIVO_NO_CORRIENTE, false);
}

/**
 * Obtiene el total de Patrimonio
 * Código: 3
 */
export function getPatrimonio(balanceData: BalanceData[]): number {
  return extractAccountsByCode(balanceData, ACCOUNT_CODES.PATRIMONIO, false);
}

// ============================================
// CÁLCULO DE CAMBIOS EN CAPITAL DE TRABAJO
// ============================================

/**
 * Calcula los cambios en el capital de trabajo entre dos períodos
 * Estos cambios afectan el flujo de caja operativo
 */
export function calculateWorkingCapitalChanges(
  balanceActual: BalanceData[],
  balanceAnterior: BalanceData[] | null
): {
  cuentasPorCobrar: { mesActual: number; mesAnterior: number; cambio: number };
  inventarios: { mesActual: number; mesAnterior: number; cambio: number };
  cuentasPorPagar: { mesActual: number; mesAnterior: number; cambio: number };
  total: number;
} {
  // Obtener valores actuales
  const cxcActual = getCuentasPorCobrar(balanceActual);
  const invActual = getInventarios(balanceActual);
  const cxpActual = getCuentasPorPagar(balanceActual);
  
  // Si no hay mes anterior, asumir que no hay cambios
  if (!balanceAnterior || balanceAnterior.length === 0) {
    return {
      cuentasPorCobrar: { mesActual: cxcActual, mesAnterior: 0, cambio: 0 },
      inventarios: { mesActual: invActual, mesAnterior: 0, cambio: 0 },
      cuentasPorPagar: { mesActual: cxpActual, mesAnterior: 0, cambio: 0 },
      total: 0,
    };
  }
  
  // Obtener valores del mes anterior
  const cxcAnterior = getCuentasPorCobrar(balanceAnterior);
  const invAnterior = getInventarios(balanceAnterior);
  const cxpAnterior = getCuentasPorPagar(balanceAnterior);
  
  // Calcular cambios
  // IMPORTANTE: La lógica es:
  // - Si CxC aumenta → NEGATIVO (dinero que NO se cobró)
  // - Si Inventarios aumenta → NEGATIVO (dinero invertido en stock)
  // - Si CxP aumenta → POSITIVO (dinero que NO se pagó)
  
  const deltaCxC = -(cxcActual - cxcAnterior); // Negativo si aumenta
  const deltaInv = -(invActual - invAnterior);  // Negativo si aumenta
  const deltaCxP = (cxpActual - cxpAnterior);   // Positivo si aumenta
  
  const total = deltaCxC + deltaInv + deltaCxP;
  
  return {
    cuentasPorCobrar: {
      mesActual: cxcActual,
      mesAnterior: cxcAnterior,
      cambio: deltaCxC,
    },
    inventarios: {
      mesActual: invActual,
      mesAnterior: invAnterior,
      cambio: deltaInv,
    },
    cuentasPorPagar: {
      mesActual: cxpActual,
      mesAnterior: cxpAnterior,
      cambio: deltaCxP,
    },
    total,
  };
}

// ============================================
// CÁLCULO DE INDICADORES
// ============================================

/**
 * Calcula el Margen de Flujo Operativo
 * Indica qué porcentaje de las ventas se convierte en efectivo
 * Ideal: > 15%
 */
export function calculateCashFlowMargin(
  flujoOperativo: number,
  ingresosOperacionales: number
): number {
  if (ingresosOperacionales === 0) return 0;
  return (flujoOperativo / ingresosOperacionales) * 100;
}

/**
 * Calcula la Calidad de los Ingresos
 * Compara el flujo operativo con la utilidad neta
 * Ideal: > 100% (se cobra más de lo que se vende)
 * Problema: < 80% (muchas ventas a crédito sin cobrar)
 */
export function calculateIncomeQuality(
  flujoOperativo: number,
  utilidadNeta: number
): number {
  if (utilidadNeta === 0) return 0;
  return (flujoOperativo / utilidadNeta) * 100;
}

/**
 * Calcula los Días de Efectivo Disponible
 * Indica cuántos días puede operar la empresa con el efectivo actual
 * Ideal: > 60 días
 */
export function calculateCashDays(
  saldoEfectivo: number,
  gastosOperativosMensuales: number
): number {
  if (gastosOperativosMensuales === 0) return 0;
  const gastosDiarios = gastosOperativosMensuales / 30;
  return saldoEfectivo / gastosDiarios;
}

/**
 * Calcula la Cobertura de Inversiones
 * Indica si el flujo operativo puede financiar las inversiones
 * Ideal: > 1.5
 */
export function calculateInvestmentCoverage(
  flujoOperativo: number,
  flujoInversion: number
): number {
  if (flujoInversion >= 0) return 0; // No hay inversiones
  return flujoOperativo / Math.abs(flujoInversion);
}

// ============================================
// FORMATEO Y UTILIDADES
// ============================================

/**
 * Formatea un número como moneda chilena
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthNumber - 1] || 'Desconocido';
}

/**
 * Genera el nombre del período
 */
export function getPeriodName(year: number, month: number): string {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Clasifica un indicador según umbrales
 */
export function classifyIndicator(
  value: number,
  type: 'margin' | 'quality' | 'days' | 'coverage'
): 'excellent' | 'good' | 'warning' | 'critical' {
  switch (type) {
    case 'margin':
      if (value >= 15) return 'excellent';
      if (value >= 10) return 'good';
      if (value >= 5) return 'warning';
      return 'critical';
      
    case 'quality':
      if (value >= 100) return 'excellent';
      if (value >= 80) return 'good';
      if (value >= 60) return 'warning';
      return 'critical';
      
    case 'days':
      if (value >= 60) return 'excellent';
      if (value >= 30) return 'good';
      if (value >= 15) return 'warning';
      return 'critical';
      
    case 'coverage':
      if (value >= 1.5) return 'excellent';
      if (value >= 1.2) return 'good';
      if (value >= 1.0) return 'warning';
      return 'critical';
      
    default:
      return 'good';
  }
}
