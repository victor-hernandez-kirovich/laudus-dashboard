import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const db = await getDatabase();
        const collection = db.collection('balance_8columns');

        // Obtener todos los datos ordenados por fecha descendente
        const allDocuments = await collection
            .find({})
            .sort({ date: -1 })
            .toArray();

        if (!allDocuments || allDocuments.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No data found',
                data: []
            });
        }

        // Procesar cada documento para calcular ROA y ROI
        const rentabilidadData = allDocuments.map(doc => {
            const records = doc.data || [];

            // Buscar la fila "Sumas" que contiene los totales
            const filaSumas = records.find((r: any) => r.accountName === "Sumas");

            if (!filaSumas) {
                return {
                    date: doc.date,
                    roa: 0,
                    roi: 0,
                    utilidadNeta: 0,
                    activoTotal: 0,
                    patrimonio: 0
                };
            }

            // Obtener valores
            const ingresos = parseFloat(filaSumas.incomes || 0);
            const gastos = parseFloat(filaSumas.expenses || 0);
            const activoTotal = parseFloat(filaSumas.assets || 0);
            const pasivoTotal = parseFloat(filaSumas.liabilities || 0);

            // Calcular Utilidad Neta = Ingresos - Gastos
            const utilidadNeta = ingresos - gastos;

            // Calcular Patrimonio = Activo Total - Pasivo Total
            const patrimonio = activoTotal - pasivoTotal;

            // Calcular ROA = (Utilidad Neta / Activo Total) * 100
            const roa = activoTotal > 0 ? (utilidadNeta / activoTotal) * 100 : 0;

            // Calcular ROI (ROE) = (Utilidad Neta / Patrimonio) * 100
            const roi = patrimonio > 0 ? (utilidadNeta / patrimonio) * 100 : 0;

            return {
                date: doc.date,
                roa: roa,
                roi: roi,
                utilidadNeta: utilidadNeta,
                activoTotal: activoTotal,
                patrimonio: patrimonio,
                ingresos: ingresos,
                gastos: gastos,
                pasivoTotal: pasivoTotal
            };
        });

        return NextResponse.json({
            success: true,
            data: rentabilidadData,
            count: rentabilidadData.length
        });

    } catch (error: any) {
        console.error('Error calculating rentabilidad:', error);
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
