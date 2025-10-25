// Script para ver las fechas disponibles en balance_8columns
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://kirovich_dev:%408%40HcHDzUgHweD%2AA@kirovich.oedv2gq.mongodb.net/';
const dbName = 'laudus_data';

async function checkDates() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('balance_8columns');
    
    // Obtener todas las fechas disponibles
    const documents = await collection.find({}, { projection: { date: 1 } })
      .sort({ date: -1 })
      .limit(30)
      .toArray();
    
    console.log(`=== FECHAS DISPONIBLES EN BALANCE_8COLUMNS ===\n`);
    console.log(`Total documentos: ${documents.length}\n`);
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.date} (ID: ${doc._id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Conexión cerrada');
  }
}

checkDates();
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('balance_8columns');
    
    // Tomar el documento más reciente
    const latestDoc = await collection.findOne({}, { sort: { date: -1 } });
    
    if (!latestDoc) {
      console.log('❌ No se encontraron documentos');
      return;
    }
    
    console.log(`=== ANÁLISIS DEL BALANCE: ${latestDoc.date} ===\n`);
    
    const data = latestDoc.data || [];
    
    // 1. BUSCAR CUENTAS POR COBRAR
    console.log('📊 1. CUENTAS POR COBRAR\n');
    const cuentasPorCobrar = data.filter(item => 
      item.accountName && item.accountName.toLowerCase().includes('cuentas por cobrar')
    );
    
    console.log(`Encontradas: ${cuentasPorCobrar.length} cuentas`);
    let totalCxC = 0;
    cuentasPorCobrar.forEach(cuenta => {
      const saldo = (cuenta.debit || 0) - (cuenta.credit || 0);
      totalCxC += saldo;
      console.log(`  - ${cuenta.accountName}`);
      console.log(`    Código: ${cuenta.accountNumber}, Debe: ${cuenta.debit}, Haber: ${cuenta.credit}, Saldo: ${saldo}`);
    });
    console.log(`\n✅ TOTAL CUENTAS POR COBRAR: ${totalCxC.toLocaleString('es-CL')}\n`);
    
    // 2. BUSCAR CUENTAS POR PAGAR
    console.log('📊 2. CUENTAS POR PAGAR\n');
    const cuentasPorPagar = data.filter(item => 
      item.accountName && item.accountName.toLowerCase().includes('cuentas por pagar')
    );
    
    console.log(`Encontradas: ${cuentasPorPagar.length} cuentas`);
    let totalCxP = 0;
    cuentasPorPagar.forEach(cuenta => {
      const saldo = (cuenta.credit || 0) - (cuenta.debit || 0); // Pasivos van al revés
      totalCxP += saldo;
      console.log(`  - ${cuenta.accountName}`);
      console.log(`    Código: ${cuenta.accountNumber}, Debe: ${cuenta.debit}, Haber: ${cuenta.credit}, Saldo: ${saldo}`);
    });
    console.log(`\n✅ TOTAL CUENTAS POR PAGAR: ${totalCxP.toLocaleString('es-CL')}\n`);
    
    // 3. BUSCAR INGRESOS (Código 4000-4999)
    console.log('📊 3. INGRESOS (Código 4xxx)\n');
    const ingresos = data.filter(item => {
      const code = parseInt(item.accountNumber);
      return code >= 4000 && code < 5000;
    });
    
    let totalIngresos = 0;
    console.log(`Encontradas: ${ingresos.length} cuentas de ingresos`);
    ingresos.slice(0, 5).forEach(cuenta => {
      const valor = cuenta.incomes || 0;
      totalIngresos += valor;
      console.log(`  - ${cuenta.accountName}: ${valor.toLocaleString('es-CL')}`);
    });
    if (ingresos.length > 5) console.log(`  ... y ${ingresos.length - 5} más`);
    console.log(`\n✅ TOTAL INGRESOS: ${totalIngresos.toLocaleString('es-CL')}\n`);
    
    // 4. BUSCAR INVENTARIO para aproximar Costo de Ventas
    console.log('📊 4. INVENTARIO\n');
    const inventario = data.filter(item => {
      const nombre = item.accountName?.toLowerCase() || '';
      return nombre.includes('inventario') || nombre.includes('existencia');
    });
    
    let totalInventario = 0;
    console.log(`Encontradas: ${inventario.length} cuentas de inventario`);
    inventario.forEach(cuenta => {
      const saldo = (cuenta.debit || 0) - (cuenta.credit || 0);
      totalInventario += saldo;
      console.log(`  - ${cuenta.accountName}`);
      console.log(`    Código: ${cuenta.accountNumber}, Debe: ${cuenta.debit}, Haber: ${cuenta.credit}, Saldo: ${saldo}`);
    });
    console.log(`\n✅ TOTAL INVENTARIO: ${totalInventario.toLocaleString('es-CL')}\n`);
    
    // 5. BUSCAR COMPRAS (para aproximar Costo de Ventas)
    console.log('📊 5. COMPRAS Y GASTOS OPERACIONALES\n');
    const compras = data.filter(item => {
      const code = parseInt(item.accountNumber);
      const nombre = item.accountName?.toLowerCase() || '';
      return (code >= 3000 && code < 4000) || nombre.includes('compra') || nombre.includes('gasto');
    });
    
    let totalCompras = 0;
    console.log(`Encontradas: ${compras.length} cuentas de compras/gastos`);
    compras.slice(0, 10).forEach(cuenta => {
      const valor = cuenta.expenses || 0;
      totalCompras += valor;
      console.log(`  - ${cuenta.accountName}: ${valor.toLocaleString('es-CL')}`);
    });
    if (compras.length > 10) console.log(`  ... y ${compras.length - 10} más`);
    console.log(`\n✅ TOTAL COMPRAS/GASTOS: ${totalCompras.toLocaleString('es-CL')}\n`);
    
    // 6. CALCULAR INDICADORES
    console.log('=== CÁLCULO DE INDICADORES ===\n');
    
    if (totalIngresos > 0) {
      const diasCobro = (totalCxC * 360) / totalIngresos;
      console.log(`📅 DÍAS DE COBRO (DSO): ${diasCobro.toFixed(2)} días`);
      console.log(`   Fórmula: (${totalCxC.toLocaleString('es-CL')} × 360) / ${totalIngresos.toLocaleString('es-CL')}`);
    } else {
      console.log('⚠️  No se puede calcular Días de Cobro: Ingresos = 0');
    }
    
    console.log('');
    
    // Aproximar Costo de Ventas usando Compras + Variación de Inventario
    // Costo de Ventas ≈ Compras + (Inventario Inicial - Inventario Final)
    // Para un solo mes, usamos: Costo de Ventas ≈ Compras (asumiendo inventario estable)
    
    if (totalCompras > 0) {
      const diasPago = (totalCxP * 360) / totalCompras;
      console.log(`📅 DÍAS DE PAGO (DPO): ${diasPago.toFixed(2)} días`);
      console.log(`   Fórmula: (${totalCxP.toLocaleString('es-CL')} × 360) / ${totalCompras.toLocaleString('es-CL')}`);
      console.log(`   ⚠️  Usando COMPRAS/GASTOS como aproximación del Costo de Ventas`);
      console.log(`   💡 Inventario actual: ${totalInventario.toLocaleString('es-CL')}`);
    } else {
      console.log('⚠️  No se puede calcular Días de Pago: Compras = 0');
    }
    
    console.log('\n=== ANÁLISIS MENSUAL HISTÓRICO ===');
    console.log('Para mejorar la precisión, voy a consultar varios meses...\n');
    
    // Consultar últimos 3 meses para calcular variación de inventario
    const threeMonthsAgo = new Date(latestDoc.date);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().split('T')[0];
    
    const historicalDocs = await collection.find({
      date: { $gte: startDate }
    }).sort({ date: 1 }).toArray();
    
    console.log(`Documentos encontrados desde ${startDate}: ${historicalDocs.length}\n`);
    
    if (historicalDocs.length >= 2) {
      console.log('📊 Variación de Inventario:\n');
      
      const inventarios = historicalDocs.map(doc => {
        const data = doc.data || [];
        const inv = data.filter(item => {
          const nombre = item.accountName?.toLowerCase() || '';
          return nombre.includes('inventario') || nombre.includes('existencia');
        });
        const total = inv.reduce((sum, cuenta) => sum + ((cuenta.debit || 0) - (cuenta.credit || 0)), 0);
        return { date: doc.date, inventario: total };
      });
      
      inventarios.forEach(item => {
        console.log(`  ${item.date}: ${item.inventario.toLocaleString('es-CL')}`);
      });
      
      const inventarioInicial = inventarios[0].inventario;
      const inventarioFinal = inventarios[inventarios.length - 1].inventario;
      const variacionInventario = inventarioInicial - inventarioFinal;
      
      console.log(`\n  Variación: ${variacionInventario.toLocaleString('es-CL')} (${inventarioInicial.toLocaleString('es-CL')} - ${inventarioFinal.toLocaleString('es-CL')})`);
      
      if (totalCompras > 0) {
        const costoVentasAproximado = totalCompras + variacionInventario;
        console.log(`\n💡 Costo de Ventas Aproximado = Compras + Variación Inventario`);
        console.log(`   ${costoVentasAproximado.toLocaleString('es-CL')} = ${totalCompras.toLocaleString('es-CL')} + ${variacionInventario.toLocaleString('es-CL')}`);
        
        if (costoVentasAproximado > 0) {
          const diasPagoAjustado = (totalCxP * 360) / costoVentasAproximado;
          console.log(`\n📅 DÍAS DE PAGO AJUSTADO (DPO): ${diasPagoAjustado.toFixed(2)} días`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Conexión cerrada');
  }
}

analyzeCuentas();
