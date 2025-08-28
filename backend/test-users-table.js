import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function testUsersTable() {
  let db;
  
  try {
    console.log('🔍 Verificando estructura de la tabla users...');
    
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });
    
    // Verificar estructura de la tabla users
    const tableInfo = await db.all("PRAGMA table_info(users)");
    console.log('📋 Estructura de tabla users:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar si la columna profile_picture existe
    const hasProfilePicture = tableInfo.some(col => col.name === 'profile_picture');
    console.log(`\n✅ Columna profile_picture: ${hasProfilePicture ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Mostrar algunos usuarios de ejemplo
    const users = await db.all('SELECT id, username, profile_picture FROM users LIMIT 5');
    console.log('\n👥 Usuarios de ejemplo:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Profile Picture: ${user.profile_picture || 'No definida'}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

testUsersTable();
