import { pool } from './db';

async function main() {
  try {
    const hash = '$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.'; // Hash de '123'
    
    console.log('Insertando credenciales de prueba en la base de datos...');
    
    // 1. Admin
    await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado) 
       VALUES ('11111111', 'Admin', 'Sistema', 'admin@unap.edu.pe', $1, 'admin', 'Ingeniería Estadística', 'activo') 
       ON CONFLICT (correo_institucional) DO UPDATE SET password_hash = $1, rol = 'admin'`,
      [hash]
    );
    console.log('- Admin creado/actualizado.');

    // 2. Investigador
    await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado) 
       VALUES ('22222222', 'Eduardo', 'Investigador', 'investigador@unap.edu.pe', $1, 'investigador', 'Ingeniería Estadística', 'activo') 
       ON CONFLICT (correo_institucional) DO UPDATE SET password_hash = $1, rol = 'investigador'`,
      [hash]
    );
    console.log('- Investigador creado/actualizado.');

    // 3. Revisor
    await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado) 
       VALUES ('33333333', 'Dra. María', 'Revisora', 'revisor@unap.edu.pe', $1, 'revisor', 'Ciencias de la Salud', 'activo') 
       ON CONFLICT (correo_institucional) DO UPDATE SET password_hash = $1, rol = 'revisor'`,
      [hash]
    );
    console.log('- Revisor creado/actualizado.');

    // 4. Secretario
    await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado) 
       VALUES ('44444444', 'Ana', 'Secretaria', 'secretaria@unap.edu.pe', $1, 'secretario', 'Ciencias Jurídicas', 'activo') 
       ON CONFLICT (correo_institucional) DO UPDATE SET password_hash = $1, rol = 'secretario'`,
      [hash]
    );
    console.log('- Secretario creado/actualizado.');

    // 5. Presidente
    await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado) 
       VALUES ('55555555', 'Dr. Carlos', 'Presidente', 'presidente@unap.edu.pe', $1, 'presidente', 'Medicina Veterinaria', 'activo') 
       ON CONFLICT (correo_institucional) DO UPDATE SET password_hash = $1, rol = 'presidente'`,
      [hash]
    );
    console.log('- Presidente creado/actualizado.');
    
    console.log('✅ ¡Las 5 credenciales de prueba han sido creadas exitosamente!');
  } catch (error) {
    console.error('❌ Error al insertar credenciales:', error);
  } finally {
    await pool.end();
  }
}

main();
