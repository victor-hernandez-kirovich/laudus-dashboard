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
    console.log(`Total documentos encontrados: ${documents.length}\n`);
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.date} (ID: ${doc._id})`);
    });
    
    // Agrupar por mes
    const byMonth = {};
    documents.forEach(doc => {
      const month = doc.date.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    
    console.log('\n=== DOCUMENTOS POR MES ===\n');
    Object.keys(byMonth).sort().reverse().forEach(month => {
      console.log(`${month}: ${byMonth[month]} documentos`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Conexión cerrada');
  }
}

checkDates();
