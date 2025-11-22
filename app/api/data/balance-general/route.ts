import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * Process 8-Columns Balance data into Balance General structure
 * This includes ALL accounts to show complete detail
 */
function processBalanceSheet(sourceData: any[]): any {
    const assets: any[] = [];
    const liabilities: any[] = [];

    let totalAssets = 0.0;
    let totalLiabilities = 0.0;

    // Procesar TODAS las cuentas para mostrar el detalle completo
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

        // Agregar a activos (todas las cuentas, incluso con valor 0)
        assets.push({
            accountCode: account.accountNumber,  // CORREGIDO: Usar 'accountNumber'
            accountName: account.accountName,    // CORREGIDO: Usar 'accountName'
            amount: assetVal
        });
        totalAssets += assetVal;

        // Agregar a pasivos (todas las cuentas, incluso con valor 0)
        liabilities.push({
            accountCode: account.accountNumber,  // CORREGIDO: Usar 'accountNumber'
            accountName: account.accountName,    // CORREGIDO: Usar 'accountName'
            amount: liabilityVal
        });
        totalLiabilities += liabilityVal;
    }

    // Calculate Result of Exercise (Profit/Loss)
    const resultOfExercise = totalAssets - totalLiabilities;

    const equity: any[] = [];

    // Add Result of Exercise to Equity
    equity.push({
        accountCode: 'RES-EJER',
        accountName: 'Resultado del Ejercicio',
        amount: resultOfExercise
    });

    const totalEquity = resultOfExercise;

    return {
        assets: assets.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        liabilities: liabilities.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || '')),
        equity: equity,
        totals: {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            total_equity: totalEquity,
            balance_check: totalAssets - (totalLiabilities + totalEquity)
        }
    };
}

/**
 * GET /api/data/balance-general
 * Dynamically generates Balance General from balance_8columns data
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedDate = searchParams.get('date');

        const db = await getDatabase();
        const collection = db.collection('balance_8columns');

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
            const balanceGeneral = processBalanceSheet(sourceData);

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

        // If no date specified, get all available dates and process each
        const allDocuments = await collection
            .find({})
            .sort({ date: -1 })
            .toArray();

        const processedData = allDocuments.map(doc => {
            const sourceData = doc.data || [];
            const balanceGeneral = processBalanceSheet(sourceData);

            return {
                date: doc.date,
                generatedAt: new Date().toISOString(),
                source: 'balance_8columns',
                ...balanceGeneral
            };
        });

        return NextResponse.json({
            success: true,
            data: processedData,
            count: processedData.length
        });

    } catch (error: any) {
        console.error('Error generating balance general:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                data: []
            },
            { status: 500 }
        );
    }
}
