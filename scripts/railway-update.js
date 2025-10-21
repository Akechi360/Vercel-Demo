const { Client } = require('pg');

async function updateRole() {
  console.log('🔐 Actualizando rol del usuario en Railway...');
  
  // Railway proporciona DATABASE_URL automáticamente
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway');

    // Actualizar solo el rol
    const result = await client.query(`
      UPDATE "User" 
      SET role = 'ADMIN', status = 'ACTIVE'
      WHERE email = 'dev-master-mguwx79b@urovital.com'
      RETURNING id, email, name, role, status
    `);

    if (result.rows.length > 0) {
      console.log('✅ ¡Listo! Usuario actualizado:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Rol: ${result.rows[0].role}`);
      console.log(`   Estado: ${result.rows[0].status}`);
      console.log('\n🎉 Ahora puedes iniciar sesión con:');
      console.log('   Email: dev-master-mguwx79b@urovital.com');
      console.log('   Contraseña: [tu contraseña actual]');
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Solución: Ejecuta este script desde Railway CLI:');
    console.log('   railway run node scripts/railway-update.js');
  } finally {
    await client.end();
  }
}

updateRole();

