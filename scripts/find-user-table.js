const { Client } = require('pg');

async function findUserTable() {
  console.log('🔍 Buscando tabla de usuarios...');
  
  const client = new Client({
    connectionString: "postgresql://postgres:JuGAokFoDmLZoiJoGKyEvFtFtNOLpdFU@trolley.proxy.rlwy.net:13611/railway"
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway PostgreSQL');

    // Buscar tablas que contengan 'user'
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%user%'
    `);

    console.log('📋 Tablas encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Buscar el usuario específico en cada tabla
    for (const table of result.rows) {
      const tableName = table.table_name;
      console.log(`\n🔍 Buscando en tabla: ${tableName}`);
      
      try {
        const userResult = await client.query(`
          SELECT * FROM "${tableName}" 
          WHERE email = $1
        `, ['dev-master-mguwx79b@urovital.com']);
        
        if (userResult.rows.length > 0) {
          console.log('✅ Usuario encontrado!');
          console.log('Datos:', userResult.rows[0]);
          
          // Actualizar el rol
          const updateResult = await client.query(`
            UPDATE "${tableName}" 
            SET role = 'ADMIN', status = 'ACTIVE'
            WHERE email = $1
            RETURNING id, email, name, role, status
          `, ['dev-master-mguwx79b@urovital.com']);
          
          console.log('✅ Rol actualizado exitosamente:');
          console.log(`   Email: ${updateResult.rows[0].email}`);
          console.log(`   Rol: ${updateResult.rows[0].role}`);
          console.log(`   Estado: ${updateResult.rows[0].status}`);
          break;
        }
      } catch (err) {
        console.log(`   ❌ Error en ${tableName}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

findUserTable();

