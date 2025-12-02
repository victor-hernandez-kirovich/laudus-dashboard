import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * Process 8-Columns Balance data into EERR (Estado de Resultados)
 * Uses Bal.Acree for incomes (code 4x) and Bal.Deud for expenses (code 3x)
 */
function processEERR(sourceData: any[]): any {
    // Initialize accumulators for each account type
    const accounts: { [key: string]: { name: string, amount: number, details: any[] } } = {
        '41': { name: 'Ingresos Operacionales', amount: 0, details: [] },
        '31': { name: 'Costo de Ventas', amount: 0, details: [] },
        '32': { name: 'Gastos de Administración y Ventas', amount: 0, details: [] },
        '33': { name: 'Depreciación', amount: 0, details: [] },
        '42': { name: 'Ingresos No Operacionales', amount: 0, details: [] },
        '34': { name: 'Gastos No Operacionales', amount: 0, details: [] },
        '35': { name: 'Corrección Monetaria', amount: 0, details: [] },
        '36': { name: 'Impuesto a la Renta', amount: 0, details: [] }
    };

    // Process each account
    for (const account of sourceData) {
        if (!account.accountNumber) continue;

        const accountCode = account.accountNumber.toString();
        const firstTwo = accountCode.substring(0, 2);

        // Skip if not in our target codes
        if (!accounts[firstTwo]) continue;

        // For incomes (4x): use Bal.Acree (credit balance)
        // For expenses (3x): use Bal.Deud (debit balance)
        const firstDigit = accountCode.charAt(0);
        let amount = 0;

        if (firstDigit === '4') {
            // Income accounts - use credit balance
            amount = parseFloat(account.incomes || 0);
        } else if (firstDigit === '3') {
            // Expense accounts - use debit balance
            amount = parseFloat(account.expenses || 0);
        }

        if (amount > 0) {
            accounts[firstTwo].amount += amount;
            accounts[firstTwo].details.push({
                accountCode: account.accountNumber,
                accountName: account.accountName,
                amount: amount
            });
        }
    }

    // Calculate intermediate results
    const ingresosOperacionales = accounts['41'].amount;
    const costoVentas = accounts['31'].amount;
    const margenBruto = ingresosOperacionales - costoVentas;

    const gastosAdmin = accounts['32'].amount;
    const depreciacion = accounts['33'].amount;
    const resultadoOperacional = margenBruto - gastosAdmin - depreciacion;

    const ingresosNoOperacionales = accounts['42'].amount;
    const gastosNoOperacionales = accounts['34'].amount;
    const correccionMonetaria = accounts['35'].amount;
    const resultadoAntesImpuestos = resultadoOperacional + ingresosNoOperacionales - gastosNoOperacionales - correccionMonetaria;

    const impuestoRenta = accounts['36'].amount;
    const utilidadPerdida = resultadoAntesImpuestos - impuestoRenta;

    // Helper function to calculate vertical analysis (% of Ingresos Operacionales)
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
                verticalAnalysis: 100 // Base: always 100%
            },
            costoVentas: {
                label: '(-) Costo de Ventas',
                code: '31',
                amount: costoVentas,
                details: accounts['31'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(costoVentas)
            },
            margenBruto: {
                label: 'MARGEN BRUTO',
                amount: margenBruto,
                type: 'calculated',
                level: 1,
                verticalAnalysis: calcVertical(margenBruto)
            },
            gastosAdmin: {
                label: '(-) Gastos de Administración y Ventas',
                code: '32',
                amount: gastosAdmin,
                details: accounts['32'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(gastosAdmin)
            },
            depreciacion: {
                label: '(-) Depreciación',
                code: '33',
                amount: depreciacion,
                details: accounts['33'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(depreciacion)
            },
            resultadoOperacional: {
                label: 'RESULTADO OPERACIONAL',
                amount: resultadoOperacional,
                type: 'calculated',
                level: 1,
                verticalAnalysis: calcVertical(resultadoOperacional)
            },
            ingresosNoOperacionales: {
                label: '(+) Ingresos No Operacionales',
                code: '42',
                amount: ingresosNoOperacionales,
                details: accounts['42'].details,
                type: 'income',
                verticalAnalysis: calcVertical(ingresosNoOperacionales)
            },
            gastosNoOperacionales: {
                label: '(-) Gastos No Operacionales',
                code: '34',
                amount: gastosNoOperacionales,
                details: accounts['34'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(gastosNoOperacionales)
            },
            correccionMonetaria: {
                label: '(-) Corrección Monetaria',
                code: '35',
                amount: correccionMonetaria,
                details: accounts['35'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(correccionMonetaria)
            },
            resultadoAntesImpuestos: {
                label: 'RESULTADO ANTES DE IMPUESTOS',
                amount: resultadoAntesImpuestos,
                type: 'calculated',
                level: 1,
                verticalAnalysis: calcVertical(resultadoAntesImpuestos)
            },
            impuestoRenta: {
                label: '(-) Impuesto a la Renta',
                code: '36',
                amount: impuestoRenta,
                details: accounts['36'].details,
                type: 'expense',
                verticalAnalysis: calcVertical(impuestoRenta)
            },
            utilidadPerdida: {
                label: 'UTILIDAD/PÉRDIDA DEL EJERCICIO',
                amount: utilidadPerdida,
                type: 'calculated',
                level: 2,
                verticalAnalysis: calcVertical(utilidadPerdida)
            }
        },
        summary: {
            ingresosOperacionales,
            costoVentas,
            margenBruto,
            margenBrutoPercentage: ingresosOperacionales > 0 ? (margenBruto / ingresosOperacionales) * 100 : 0,
            gastosAdmin,
            depreciacion,
            resultadoOperacional,
            ingresosNoOperacionales,
            gastosNoOperacionales,
            correccionMonetaria,
            resultadoAntesImpuestos,
            impuestoRenta,
            utilidadPerdida,
            margenNetoPercentage: ingresosOperacionales > 0 ? (utilidadPerdida / ingresosOperacionales) * 100 : 0
        }
    };
}

/**
 * GET /api/data/eerr
 * Dynamically generates Estado de Resultados from balance_8columns data
 * Query params: ?year=2024 (returns all months of that year)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedYear = searchParams.get('year');

        const db = await getDatabase();
        const collection = db.collection('balance_8columns');

        // If year is requested, get all months from that year
        if (requestedYear) {
            const yearDocs = await collection
                .find({ date: { $regex: `^${requestedYear}` } } as any)
                .sort({ date: 1 })
                .toArray();

            if (yearDocs.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: `No data found for year ${requestedYear}`,
                    data: null,
                    availableYears: []
                });
            }

            // Process data by month
            const monthlyData: { [key: string]: any } = {};
            const sortedMonths: string[] = [];

            for (const doc of yearDocs) {
                const month = doc.date.substring(5, 7); // Extract MM from YYYY-MM-DD
                const sourceData = doc.data || [];
                const eerr = processEERR(sourceData);
                monthlyData[month] = eerr;
                sortedMonths.push(month);
            }

            // Add horizontal analysis (month-to-month comparison)
            const lineKeys = [
                'ingresosOperacionales', 'costoVentas', 'margenBruto',
                'gastosAdmin', 'depreciacion', 'resultadoOperacional',
                'ingresosNoOperacionales', 'gastosNoOperacionales', 'correccionMonetaria',
                'resultadoAntesImpuestos', 'impuestoRenta', 'utilidadPerdida'
            ];

            for (let i = 0; i < sortedMonths.length; i++) {
                const currentMonth = sortedMonths[i];
                const previousMonth = i > 0 ? sortedMonths[i - 1] : null;

                for (const lineKey of lineKeys) {
                    const currentLine = monthlyData[currentMonth].lines[lineKey];
                    
                    if (previousMonth) {
                        const previousLine = monthlyData[previousMonth].lines[lineKey];
                        const currentAmount = currentLine.amount;
                        const previousAmount = previousLine.amount;
                        
                        const variationAbsolute = currentAmount - previousAmount;
                        const variationPercentage = previousAmount !== 0 
                            ? (variationAbsolute / Math.abs(previousAmount)) * 100 
                            : (currentAmount !== 0 ? 100 : 0);

                        currentLine.horizontalAnalysis = {
                            variationAbsolute,
                            variationPercentage,
                            comparisonMonth: previousMonth
                        };
                    } else {
                        // First month has no comparison
                        currentLine.horizontalAnalysis = {
                            variationAbsolute: 0,
                            variationPercentage: 0,
                            comparisonMonth: null
                        };
                    }
                }
            }

            // Get available years
            const allDates = await collection.distinct('date');
            const availableYears = [...new Set(allDates.map((d: string) => d.substring(0, 4)))].sort().reverse();

            return NextResponse.json({
                success: true,
                data: monthlyData,
                year: requestedYear,
                availableYears,
                monthsAvailable: sortedMonths
            });
        }

        // If no year specified, return error
        return NextResponse.json({
            success: false,
            error: 'Year parameter is required. Use ?year=YYYY'
        }, { status: 400 });

    } catch (error) {
        console.error('Error fetching EERR data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch EERR data'
        }, { status: 500 });
    }
}
