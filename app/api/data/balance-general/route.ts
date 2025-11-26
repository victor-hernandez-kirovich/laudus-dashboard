import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * Classify account into category based on account code
 */
function classifyAccount(accountCode: string): { type: 'asset' | 'liability' | 'equity', subtype: 'current' | 'non-current' | 'equity' } {
    if (!accountCode) return { type: 'asset', subtype: 'current' };
    
    const code = accountCode.toString();
    const firstDigit = code.charAt(0);
    const firstTwo = code.substring(0, 2);
    
    // Activos (1)
    if (firstDigit === '1') {
        // 11 = Activo Corriente, 12 = Activo No Corriente
        return { type: 'asset', subtype: firstTwo === '11' ? 'current' : 'non-current' };
    }
    
    // Pasivos (2)
    if (firstDigit === '2') {
        // 21 = Pasivo Corriente, 22 = Pasivo No Corriente
        return { type: 'liability', subtype: firstTwo === '21' ? 'current' : 'non-current' };
    }
    
    // Patrimonio (3)
    if (firstDigit === '3') {
        return { type: 'equity', subtype: 'equity' };
    }
    
    // Default
    return { type: 'asset', subtype: 'current' };
}

/**
 * Process 8-Columns Balance data into hierarchical Balance General structure
 */
function processBalanceSheet(sourceData: any[], totalAssets: number): any {
    const currentAssets: any[] = [];
    const nonCurrentAssets: any[] = [];
    const currentLiabilities: any[] = [];
    const nonCurrentLiabilities: any[] = [];
    const equityAccounts: any[] = [];

    let totalCurrentAssets = 0.0;
    let totalNonCurrentAssets = 0.0;
    let totalCurrentLiabilities = 0.0;
    let totalNonCurrentLiabilities = 0.0;
    let totalEquity = 0.0;

    // Procesar cuentas
    for (const account of sourceData) {
        // Ignorar filas de totales y sumas que no son cuentas reales
        if (!account.accountNumber ||
            account.accountName === 'Sumas' ||
            account.accountName === 'Sumas totales' ||
            account.accountName === 'Resultado positivo' ||
            account.accountName === 'Resultado negativo') {
            continue;
        }

        const assetVal = parseFloat(account.assets || 0);
        const liabilityVal = parseFloat(account.liabilities || 0);
        const classification = classifyAccount(account.accountNumber);

        // Procesar activos
        if (assetVal > 0) {
            const accountData = {
                accountCode: account.accountNumber,
                accountName: account.accountName,
                amount: assetVal,
                verticalAnalysis: totalAssets > 0 ? (assetVal / totalAssets) * 100 : 0
            };

            if (classification.subtype === 'current') {
                currentAssets.push(accountData);
                totalCurrentAssets += assetVal;
            } else {
                nonCurrentAssets.push(accountData);
                totalNonCurrentAssets += assetVal;
            }
        }

        // Procesar pasivos
        if (liabilityVal > 0) {
            const accountData = {
                accountCode: account.accountNumber,
                accountName: account.accountName,
                amount: liabilityVal,
                verticalAnalysis: totalAssets > 0 ? (liabilityVal / totalAssets) * 100 : 0
            };

            if (classification.type === 'equity') {
                equityAccounts.push(accountData);
                totalEquity += liabilityVal;
            } else if (classification.subtype === 'current') {
                currentLiabilities.push(accountData);
                totalCurrentLiabilities += liabilityVal;
            } else {
                nonCurrentLiabilities.push(accountData);
                totalNonCurrentLiabilities += liabilityVal;
            }
        }
    }

    // Calcular resultado del ejercicio
    const totalAssetsCalculated = totalCurrentAssets + totalNonCurrentAssets;
    const totalLiabilitiesCalculated = totalCurrentLiabilities + totalNonCurrentLiabilities;
    const resultOfExercise = totalAssetsCalculated - totalLiabilitiesCalculated - totalEquity;

    // Agregar resultado del ejercicio al patrimonio si es significativo
    if (Math.abs(resultOfExercise) > 0.01) {
        equityAccounts.push({
            accountCode: 'RES-EJER',
            accountName: 'Resultado del Ejercicio',
            amount: resultOfExercise,
            verticalAnalysis: totalAssets > 0 ? (resultOfExercise / totalAssets) * 100 : 0
        });
        totalEquity += resultOfExercise;
    }

    return {
        currentAssets: currentAssets.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        nonCurrentAssets: nonCurrentAssets.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        currentLiabilities: currentLiabilities.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        nonCurrentLiabilities: nonCurrentLiabilities.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        equity: equityAccounts.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        totals: {
            totalCurrentAssets,
            totalNonCurrentAssets,
            totalAssets: totalAssetsCalculated,
            totalCurrentLiabilities,
            totalNonCurrentLiabilities,
            totalLiabilities: totalLiabilitiesCalculated,
            totalEquity,
            totalLiabilitiesAndEquity: totalLiabilitiesCalculated + totalEquity,
            balanceCheck: totalAssetsCalculated - (totalLiabilitiesCalculated + totalEquity)
        }
    };
}

/**
 * GET /api/data/balance-general
 * Dynamically generates Balance General from balance_8columns data
 * Query params: ?year=2024 (returns all months of that year)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedYear = searchParams.get('year');
        const requestedDate = searchParams.get('date');

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

            // Procesar datos por mes
            const monthlyData: { [key: string]: any } = {};
            const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            
            // Calcular total de activos del último mes disponible para análisis vertical
            const lastDoc = yearDocs[yearDocs.length - 1];
            const lastSourceData = lastDoc.data || [];
            let totalAssetsForAnalysis = 0;
            for (const account of lastSourceData) {
                if (account.accountNumber && account.accountName !== 'Sumas' && 
                    account.accountName !== 'Sumas totales') {
                    totalAssetsForAnalysis += parseFloat(account.assets || 0);
                }
            }

            // Procesar cada mes
            for (const doc of yearDocs) {
                const month = doc.date.substring(5, 7); // Extract MM from YYYY-MM-DD
                const sourceData = doc.data || [];
                const balanceGeneral = processBalanceSheet(sourceData, totalAssetsForAnalysis);
                monthlyData[month] = balanceGeneral;
            }

            // Obtener años disponibles
            const allDates = await collection.distinct('date');
            const availableYears = [...new Set(allDates.map((d: string) => d.substring(0, 4)))].sort().reverse();

            return NextResponse.json({
                success: true,
                data: {
                    year: requestedYear,
                    months: monthlyData,
                    generatedAt: new Date().toISOString(),
                    source: 'balance_8columns'
                },
                availableYears,
                count: Object.keys(monthlyData).length
            });
        }

        // If a specific date is requested, get only that date
        if (requestedDate) {
            const docId = `${requestedDate}-8Columns`;
            const document = await collection.findOne({ _id: docId } as any);

            if (!document) {
                return NextResponse.json({
                    success: false,
                    error: `No data found for date ${requestedDate}`,
                    data: []
                });
            }

            const sourceData = document.data || [];
            let totalAssets = 0;
            for (const account of sourceData) {
                if (account.accountNumber) {
                    totalAssets += parseFloat(account.assets || 0);
                }
            }
            const balanceGeneral = processBalanceSheet(sourceData, totalAssets);

            return NextResponse.json({
                success: true,
                data: [{
                    date: requestedDate,
                    generatedAt: new Date().toISOString(),
                    source: 'balance_8columns',
                    ...balanceGeneral
                }],
                count: 1
            });
        }

        // If no parameters, get all available years
        const allDates = await collection.distinct('date');
        const availableYears = [...new Set(allDates.map((d: string) => d.substring(0, 4)))].sort().reverse();

        return NextResponse.json({
            success: true,
            data: null,
            availableYears,
            message: 'Please specify ?year=YYYY to get comparative balance sheet'
        });

    } catch (error: any) {
        console.error('Error generating balance general:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                data: null
            },
            { status: 500 }
        );
    }
}
