import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  getEfectivoYBancos,
  getCuentasPorCobrar,
  getInventarios,
  getCuentasPorPagar,
  calculateWorkingCapitalChanges,
  calculateCashFlowMargin,
  calculateIncomeQuality,
  calculateCashDays,
  getPeriodName,
} from '@/lib/cash-flow-utils';
import type { CashFlowData, CashFlowResponse, BalanceData, EERRData } from '@/lib/types';

/**
 * GET /api/data/flujo-caja
 * Calcula el Flujo de Caja Operativo
 * 
 * Query params:
 * - date: "2025-01" (opcional) - Mes específico en formato YYYY-MM
 * - year: "2025" (opcional) - Año completo (retorna todos los meses)
 * 
 * Retorna:
 * - Flujo de Caja Operativo calculado usando Método Indirecto
 * - Parte de Utilidad Neta del EERR
 * - Suma Depreciación (no es salida de efectivo)
 * - Resta/suma cambios en Capital de Trabajo
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get('date'); // Formato: "2025-01"
    const requestedYear = searchParams.get('year'); // Formato: "2025"
    
    // Si se pide año completo, procesar todos los meses
    if (requestedYear) {
      return await processYearData(requestedYear);
    }
    
    // Si se pide un mes específico
    if (!requestedDate || !/^\d{4}-\d{2}$/.test(requestedDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetro "date" requerido en formato YYYY-MM (ej: 2025-01) o "year" (ej: 2025)',
        },
        { status: 400 }
      );
    }
    
    const [year, month] = requestedDate.split('-');
    const monthNumber = parseInt(month, 10);
    const yearNumber = parseInt(year, 10);
    
    // Calcular mes anterior
    let previousMonth = monthNumber - 1;
    let previousYear = yearNumber;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear -= 1;
    }
    const previousDate = `${previousYear}-${previousMonth.toString().padStart(2, '0')}`;
    
    const db = await getDatabase();
    
    // ============================================
    // 1. OBTENER DATOS DEL BALANCE (MES ACTUAL Y ANTERIOR)
    // ============================================
    
    const balanceCollection = db.collection('balance_8columns');
    
    const balanceActualDoc = await balanceCollection.findOne({
      _id: { $regex: `^${requestedDate}` as any } as any,
    });
    
    const balanceAnteriorDoc = await balanceCollection.findOne({
      _id: { $regex: `^${previousDate}` as any } as any,
    });
    
    if (!balanceActualDoc || !balanceActualDoc.data) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontraron datos de Balance para ${requestedDate}`,
          message: 'Verifica que existan datos cargados para este período',
        },
        { status: 404 }
      );
    }
    
    const balanceActual: BalanceData[] = balanceActualDoc.data;
    const balanceAnterior: BalanceData[] | null = balanceAnteriorDoc?.data || null;
    
    const hasCompletePreviousMonth = balanceAnterior !== null && balanceAnterior.length > 0;
    
    // ============================================
    // 2. OBTENER DATOS DEL EERR (ESTADO DE RESULTADOS)
    // ============================================
    
    // Necesitamos procesar el EERR igual que en /api/data/eerr/route.ts
    // Para obtener la Utilidad Neta y Depreciación del período
    
    const eerrData = await calculateEERRForMonth(
      db,
      requestedDate,
      previousDate,
      balanceActual,
      balanceAnterior
    );
    
    if (!eerrData) {
      return NextResponse.json(
        {
          success: false,
          error: `No se pudieron calcular datos de EERR para ${requestedDate}`,
        },
        { status: 404 }
      );
    }
    
    // ============================================
    // 3. EXTRAER VALORES CLAVE
    // ============================================
    
    const utilidadNeta = eerrData.lines.utilidadPerdida.amount;
    const depreciacion = eerrData.lines.depreciacion.amount;
    const ingresosOperacionales = eerrData.lines.ingresosOperacionales.amount;
    const gastosAdmin = eerrData.lines.gastosAdmin.amount;
    const costoVentas = eerrData.lines.costoVentas.amount;
    const gastosOperativosMensuales = gastosAdmin + costoVentas;
    
    // ============================================
    // 4. CALCULAR CAMBIOS EN CAPITAL DE TRABAJO
    // ============================================
    
    const cambiosCapitalTrabajo = calculateWorkingCapitalChanges(
      balanceActual,
      balanceAnterior
    );
    
    // ============================================
    // 5. CALCULAR FLUJO OPERATIVO
    // ============================================
    
    const ajustesNoMonetarios = {
      depreciacion,
      otros: 0, // Puede incluir amortizaciones u otros ajustes
      total: depreciacion,
    };
    
    const flujoOperativoTotal =
      utilidadNeta +
      ajustesNoMonetarios.total +
      cambiosCapitalTrabajo.total;
    
    // ============================================
    // 6. CALCULAR SALDOS DE EFECTIVO
    // ============================================
    
    const saldoEfectivoActual = getEfectivoYBancos(balanceActual);
    const saldoEfectivoAnterior = balanceAnterior
      ? getEfectivoYBancos(balanceAnterior)
      : undefined;
    
    // ============================================
    // 7. CALCULAR INDICADORES
    // ============================================
    
    const margenFlujoOperativo = calculateCashFlowMargin(
      flujoOperativoTotal,
      ingresosOperacionales
    );
    
    const calidadIngresos = calculateIncomeQuality(
      flujoOperativoTotal,
      utilidadNeta
    );
    
    const diasEfectivo = saldoEfectivoActual && gastosOperativosMensuales > 0
      ? calculateCashDays(saldoEfectivoActual, gastosOperativosMensuales)
      : undefined;
    
    // ============================================
    // 8. GENERAR ADVERTENCIAS
    // ============================================
    
    const warnings: string[] = [];
    
    if (!hasCompletePreviousMonth) {
      warnings.push(
        'No hay datos del mes anterior. Los cambios en capital de trabajo están en cero.'
      );
    }
    
    if (flujoOperativoTotal < 0) {
      warnings.push(
        'Flujo operativo negativo: La empresa está consumiendo efectivo en operaciones.'
      );
    }
    
    if (calidadIngresos < 80) {
      warnings.push(
        'Calidad de ingresos baja: Muchas ventas a crédito sin cobrar.'
      );
    }
    
    if (diasEfectivo && diasEfectivo < 30) {
      warnings.push(
        'Días de efectivo críticos: Menos de 30 días de operación disponibles.'
      );
    }
    
    // ============================================
    // 9. CONSTRUIR RESPUESTA
    // ============================================
    
    const cashFlowData: CashFlowData = {
      period: requestedDate,
      periodName: getPeriodName(yearNumber, monthNumber),
      year: yearNumber,
      month: monthNumber,
      
      operatingCashFlow: {
        utilidadNeta,
        ajustesNoMonetarios,
        cambiosCapitalTrabajo,
        total: flujoOperativoTotal,
      },
      
      flujoNetoTotal: flujoOperativoTotal, // Por ahora solo operativo (Fase 1)
      saldoEfectivoInicial: saldoEfectivoAnterior,
      saldoEfectivoFinal: saldoEfectivoActual,
      
      indicadores: {
        margenFlujoOperativo,
        calidadIngresos,
        diasEfectivoDisponible: diasEfectivo,
      },
      
      ingresosOperacionales,
      hasCompletePreviousMonth,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    
    const response: CashFlowResponse = {
      success: true,
      data: cashFlowData,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error calculating cash flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al calcular flujo de caja',
      },
      { status: 500 }
    );
  }
}

/**
 * Calcula el EERR para un mes específico
 * Similar a /api/data/eerr/route.ts pero para un solo mes
 */
async function calculateEERRForMonth(
  db: any,
  currentDate: string,
  previousDate: string,
  currentBalanceData: BalanceData[],
  previousBalanceData: BalanceData[] | null
): Promise<EERRData | null> {
  try {
    // Procesar EERR usando la misma lógica que en eerr/route.ts
    const accounts: { [key: string]: { name: string; amount: number; details: any[] } } = {
      '41': { name: 'Ingresos Operacionales', amount: 0, details: [] },
      '31': { name: 'Costo de Ventas', amount: 0, details: [] },
      '32': { name: 'Gastos de Administración y Ventas', amount: 0, details: [] },
      '33': { name: 'Depreciación', amount: 0, details: [] },
      '42': { name: 'Ingresos No Operacionales', amount: 0, details: [] },
      '34': { name: 'Gastos No Operacionales', amount: 0, details: [] },
      '35': { name: 'Corrección Monetaria', amount: 0, details: [] },
      '36': { name: 'Impuesto a la Renta', amount: 0, details: [] },
    };

    // Procesar cuentas del balance actual
    for (const account of currentBalanceData) {
      if (!account.accountNumber) continue;

      const accountCode = account.accountNumber.toString();
      const firstTwo = accountCode.substring(0, 2);

      if (!accounts[firstTwo]) continue;

      const firstDigit = accountCode.charAt(0);
      
      let currentAmount = 0;
      if (firstDigit === '4') {
        currentAmount = parseFloat((account.incomes || 0).toString());
      } else if (firstDigit === '3') {
        currentAmount = parseFloat((account.expenses || 0).toString());
      }

      // Calcular monto del período (actual - anterior)
      let amount = currentAmount;
      if (previousBalanceData) {
        const previousAccount = previousBalanceData.find(
          (acc: any) => acc.accountNumber === account.accountNumber
        );
        if (previousAccount) {
          const previousAmount =
            firstDigit === '4'
              ? parseFloat((previousAccount.incomes || 0).toString())
              : parseFloat((previousAccount.expenses || 0).toString());
          amount = currentAmount - previousAmount;
        }
      }

      if (amount > 0) {
        accounts[firstTwo].amount += amount;
        accounts[firstTwo].details.push({
          accountCode: account.accountNumber,
          accountName: account.accountName,
          amount: amount,
        });
      }
    }

    // Calcular resultados
    const ingresosOperacionales = accounts['41'].amount;
    const costoVentas = accounts['31'].amount;
    const margenBruto = ingresosOperacionales - costoVentas;

    const gastosAdmin = accounts['32'].amount;
    const depreciacion = accounts['33'].amount;
    const resultadoOperacional = margenBruto - gastosAdmin - depreciacion;

    const ingresosNoOperacionales = accounts['42'].amount;
    const gastosNoOperacionales = accounts['34'].amount;
    const correccionMonetaria = accounts['35'].amount;
    const resultadoAntesImpuestos =
      resultadoOperacional + ingresosNoOperacionales - gastosNoOperacionales - correccionMonetaria;

    const impuestoRenta = accounts['36'].amount;
    const utilidadPerdida = resultadoAntesImpuestos - impuestoRenta;

    const calcVertical = (amount: number) => {
      return ingresosOperacionales > 0 ? (amount / ingresosOperacionales) * 100 : 0;
    };

    return {
      lines: {
        ingresosOperacionales: {
          label: 'Ingresos Operacionales',
          code: '41',
          amount: ingresosOperacionales,
          details: accounts['41'].details,
          type: 'income',
          verticalAnalysis: 100,
        },
        costoVentas: {
          label: 'Costo de Ventas',
          code: '31',
          amount: costoVentas,
          details: accounts['31'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(costoVentas),
        },
        margenBruto: {
          label: 'Margen Bruto',
          amount: margenBruto,
          type: 'calculated',
          level: 1,
          verticalAnalysis: calcVertical(margenBruto),
        },
        gastosAdmin: {
          label: 'Gastos de Administración y Ventas',
          code: '32',
          amount: gastosAdmin,
          details: accounts['32'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(gastosAdmin),
        },
        depreciacion: {
          label: 'Depreciación',
          code: '33',
          amount: depreciacion,
          details: accounts['33'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(depreciacion),
        },
        resultadoOperacional: {
          label: 'Resultado Operacional',
          amount: resultadoOperacional,
          type: 'calculated',
          level: 1,
          verticalAnalysis: calcVertical(resultadoOperacional),
        },
        ingresosNoOperacionales: {
          label: 'Ingresos No Operacionales',
          code: '42',
          amount: ingresosNoOperacionales,
          details: accounts['42'].details,
          type: 'income',
          verticalAnalysis: calcVertical(ingresosNoOperacionales),
        },
        gastosNoOperacionales: {
          label: 'Gastos No Operacionales',
          code: '34',
          amount: gastosNoOperacionales,
          details: accounts['34'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(gastosNoOperacionales),
        },
        correccionMonetaria: {
          label: 'Corrección Monetaria',
          code: '35',
          amount: correccionMonetaria,
          details: accounts['35'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(correccionMonetaria),
        },
        resultadoAntesImpuestos: {
          label: 'Resultado Antes de Impuestos',
          amount: resultadoAntesImpuestos,
          type: 'calculated',
          level: 1,
          verticalAnalysis: calcVertical(resultadoAntesImpuestos),
        },
        impuestoRenta: {
          label: 'Impuesto a la Renta',
          code: '36',
          amount: impuestoRenta,
          details: accounts['36'].details,
          type: 'expense',
          verticalAnalysis: calcVertical(impuestoRenta),
        },
        utilidadPerdida: {
          label: 'Utilidad (Pérdida) del Ejercicio',
          amount: utilidadPerdida,
          type: 'calculated',
          level: 2,
          verticalAnalysis: calcVertical(utilidadPerdida),
        },
      },
      summary: {
        ingresosOperacionales,
        costoVentas,
        margenBruto,
        margenBrutoPercentage: calcVertical(margenBruto),
        gastosAdmin,
        depreciacion,
        resultadoOperacional,
        ingresosNoOperacionales,
        gastosNoOperacionales,
        correccionMonetaria,
        resultadoAntesImpuestos,
        impuestoRenta,
        utilidadPerdida,
        margenNetoPercentage: calcVertical(utilidadPerdida),
      },
    };
  } catch (error) {
    console.error('Error calculating EERR for cash flow:', error);
    return null;
  }
}

/**
 * Procesa un año completo de flujo de caja
 */
async function processYearData(year: string) {
  try {
    const db = await getDatabase();
    const balanceCollection = db.collection('balance_8columns');
    
    // Obtener todos los meses disponibles para el año
    const balanceDocs = await balanceCollection
      .find({
        _id: { $regex: `^${year}-` as any } as any,
      })
      .sort({ _id: 1 } as any)
      .toArray();
    
    if (balanceDocs.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No se encontraron datos para el año ${year}`,
      }, { status: 404 });
    }
    
    const monthlyData: { [month: string]: CashFlowData } = {};
    const availableMonths: string[] = [];
    
    // Procesar cada mes
    for (let i = 0; i < balanceDocs.length; i++) {
      const currentDoc = balanceDocs[i];
      const previousDoc = i > 0 ? balanceDocs[i - 1] : null;
      
      const dateMatch = String(currentDoc._id).match(/^(\d{4})-(\d{2})/);
      if (!dateMatch) continue;
      
      const [, yearNum, monthNum] = dateMatch;
      const monthKey = `${yearNum}-${monthNum}`;
      const monthNumber = parseInt(monthNum, 10);
      const yearNumber = parseInt(yearNum, 10);
      
      const balanceActual: BalanceData[] = currentDoc.data || [];
      const balanceAnterior: BalanceData[] | null = previousDoc?.data || null;
      
      // Calcular EERR para el mes
      const eerrData = await calculateEERRForMonth(
        db,
        monthKey,
        i > 0 ? `${yearNum}-${String(monthNumber - 1).padStart(2, '0')}` : '',
        balanceActual,
        balanceAnterior
      );
      
      if (!eerrData) continue;
      
      const utilidadNeta = eerrData.lines.utilidadPerdida.amount;
      const depreciacion = eerrData.lines.depreciacion.amount;
      const ingresosOperacionales = eerrData.lines.ingresosOperacionales.amount;
      const gastosAdmin = eerrData.lines.gastosAdmin.amount;
      const costoVentas = eerrData.lines.costoVentas.amount;
      const gastosOperativosMensuales = gastosAdmin + costoVentas;
      
      const cambiosCapitalTrabajo = calculateWorkingCapitalChanges(
        balanceActual,
        balanceAnterior
      );
      
      const ajustesNoMonetarios = {
        depreciacion,
        otros: 0,
        total: depreciacion,
      };
      
      const flujoOperativoTotal =
        utilidadNeta +
        ajustesNoMonetarios.total +
        cambiosCapitalTrabajo.total;
      
      const saldoEfectivoActual = getEfectivoYBancos(balanceActual);
      const saldoEfectivoAnterior = balanceAnterior
        ? getEfectivoYBancos(balanceAnterior)
        : undefined;
      
      const margenFlujoOperativo = calculateCashFlowMargin(
        flujoOperativoTotal,
        ingresosOperacionales
      );
      
      const calidadIngresos = calculateIncomeQuality(
        flujoOperativoTotal,
        utilidadNeta
      );
      
      const diasEfectivo = saldoEfectivoActual && gastosOperativosMensuales > 0
        ? calculateCashDays(saldoEfectivoActual, gastosOperativosMensuales)
        : undefined;
      
      monthlyData[monthKey] = {
        period: monthKey,
        periodName: getPeriodName(yearNumber, monthNumber),
        year: yearNumber,
        month: monthNumber,
        
        operatingCashFlow: {
          utilidadNeta,
          ajustesNoMonetarios,
          cambiosCapitalTrabajo,
          total: flujoOperativoTotal,
        },
        
        flujoNetoTotal: flujoOperativoTotal,
        saldoEfectivoInicial: saldoEfectivoAnterior,
        saldoEfectivoFinal: saldoEfectivoActual,
        
        indicadores: {
          margenFlujoOperativo,
          calidadIngresos,
          diasEfectivoDisponible: diasEfectivo,
        },
        
        ingresosOperacionales,
        hasCompletePreviousMonth: balanceAnterior !== null && balanceAnterior.length > 0,
      };
      
      availableMonths.push(monthKey);
    }
    
    return NextResponse.json({
      success: true,
      data: monthlyData,
      year,
      availableMonths,
    });
    
  } catch (error: any) {
    console.error('Error processing year data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al procesar datos del año',
      },
      { status: 500 }
    );
  }
}
