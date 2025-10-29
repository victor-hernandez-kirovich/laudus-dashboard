import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const startMonth = searchParams.get("startMonth");
    const endMonth = searchParams.get("endMonth");
    const salesmanId = searchParams.get("salesmanId");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE || "laudus_data");
    const collection = db.collection("invoices_by_salesman");

    // Construir filtro
    const filter: any = {};

    if (month) {
      filter.month = month;
    } else if (startMonth && endMonth) {
      filter.month = { $gte: startMonth, $lte: endMonth };
    }

    if (salesmanId) {
      filter.salesmanId = parseInt(salesmanId);
    }

    // Obtener datos ordenados por año y mes (descendente), luego por neto (descendente)
    const data = await collection
      .find(filter)
      .sort({ year: -1, monthNumber: -1, net: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching salesman invoices:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener datos de vendedores" },
      { status: 500 }
    );
  }
}
