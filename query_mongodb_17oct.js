// Script para consultar directamente MongoDB y ver los valores del 17 de octubre
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://kirovich_dev:%408%40HcHDzUgHweD%2AA@kirovich.oedv2gq.mongodb.net/';
const dbName = 'laudus_data';

async function queryMongoDB() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('balance_8columns');
    
    // Buscar todos los documentos de octubre (últimos 15 días)
    const query = { date: { $regex: '2025-10' } };
    const documents = await collection.find(query).sort({ date: 1 }).toArray();
    
    console.log(`=== DOCUMENTOS DE OCTUBRE ===`);
    console.log(`Total encontrados: ${documents.length}\n`);
    
    if (documents.length === 0) {
      console.log('❌ No se encontraron documentos');
      return;
    }
    
    console.log('=== TABLA DE FECHAS Y VALORES ===\n');
    console.log('Fecha         | Activos         | Pasivos         | Endeud% | Día mostrado');
    console.log('-'.repeat(80));
    
    // Mostrar tabla resumida
    documents.forEach((doc) => {
      const filaSumas = doc.data?.find(r => r.accountName === "Sumas");
      if (filaSumas) {
        const endeudamiento = (filaSumas.liabilities / filaSumas.assets) * 100;
        const date = new Date(doc.date);
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = months[date.getMonth()];
        const displayDate = `${day} ${month}`;
        
        console.log(
          `${doc.date} | ${filaSumas.assets.toString().padEnd(15)} | ${filaSumas.liabilities.toString().padEnd(15)} | ${endeudamiento.toFixed(2)}% | ${displayDate}`
        );
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n=== DETALLES COMPLETOS ===\n');
    
    // Mostrar cada documento encontrado
    documents.forEach((doc, index) => {
      console.log(`\n--- DOCUMENTO ${index + 1} ---`);
      console.log(`ID: ${doc._id}`);
      console.log(`Fecha: ${doc.date}`);
      console.log(`Total de filas en data: ${doc.data ? doc.data.length : 0}`);
      
      if (doc.data) {
        // Buscar la fila "Sumas"
        const filaSumas = doc.data.find(r => r.accountName === "Sumas");
        
        if (filaSumas) {
          console.log('\n✅ FILA "Sumas" ENCONTRADA:');
          console.log(`  accountId: ${filaSumas.accountId}`);
          console.log(`  accountNumber: ${filaSumas.accountNumber}`);
          console.log(`  accountName: ${filaSumas.accountName}`);
          console.log(`  debit: ${filaSumas.debit}`);
          console.log(`  credit: ${filaSumas.credit}`);
          console.log(`  assets: ${filaSumas.assets}`);
          console.log(`  liabilities: ${filaSumas.liabilities}`);
          
          // Calcular indicadores
          const patrimonio = filaSumas.assets - filaSumas.liabilities;
          const endeudamiento = (filaSumas.liabilities / filaSumas.assets) * 100;
          const autonomia = (patrimonio / filaSumas.assets) * 100;
          
          console.log('\n📊 CÁLCULOS:');
          console.log(`  Patrimonio: ${patrimonio.toLocaleString('es-CL')}`);
          console.log(`  Endeudamiento: ${endeudamiento.toFixed(2)}%`);
          console.log(`  Autonomía: ${autonomia.toFixed(2)}%`);
          console.log(`  Suma verificación: ${(endeudamiento + autonomia).toFixed(2)}%`);
          
          console.log('\n🔍 COMPARACIÓN CON CAPTURAS:');
          console.log(`  MongoDB Compass mostró: assets=2570637179, liabilities=1619818886`);
          console.log(`  Este documento muestra: assets=${filaSumas.assets}, liabilities=${filaSumas.liabilities}`);
          
          if (filaSumas.assets === 2570637179) {
            console.log('  ✅ Este ES el documento que viste en MongoDB Compass');
          } else {
            console.log('  ❌ Este NO es el documento de MongoDB Compass (valores diferentes)');
          }
        } else {
          console.log('❌ No se encontró la fila "Sumas" en este documento');
          console.log('\nFilas disponibles:');
          doc.data.slice(0, 5).forEach(r => {
            console.log(`  - accountName: "${r.accountName}", accountNumber: "${r.accountNumber}"`);
          });
        }
      }
      
      console.log('\n' + '='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Conexión cerrada');
  }
}

queryMongoDB();
