const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetPassword() {
  console.log('🔐 Reseteando contraseña...');
  
  const client = new Client({
    connectionString: "postgresql://postgres:JuGAokFoDmLZoiJoGKyEvFtFtNOLpdFU@trolley.proxy.rlwy.net:13611/railway"
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway PostgreSQL');

    // Generar hash para la nueva contraseña
    const newPassword = 'UroVital2024!';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('🔐 Hash generado:', hashedPassword);

    // Actualizar la contraseña
    const result = await client.query(`
      UPDATE users 
      SET password = $1
      WHERE email = $2
      RETURNING id, email, name, role
    `, [hashedPassword, 'dev-master-mguwx79b@urovital.com']);

    if (result.rows.length > 0) {
      console.log('✅ Contraseña actualizada exitosamente!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('👤 Nombre:', result.rows[0].name);
      console.log('🔑 Nueva contraseña:', newPassword);
      console.log('🔐 Rol:', result.rows[0].role);
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();
