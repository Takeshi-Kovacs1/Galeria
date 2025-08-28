import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrateProfilePicture() {
  let db;
  
  try {
    console.log('🔧 Iniciando migración de foto de perfil...');
    
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });
    
    // Verificar si la columna profile_picture ya existe
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasProfilePicture = tableInfo.some(col => col.name === 'profile_picture');
    
    if (!hasProfilePicture) {
      console.log('📋 Agregando columna profile_picture a tabla users...');
      await db.run('ALTER TABLE users ADD COLUMN profile_picture TEXT');
      console.log('✅ Columna profile_picture agregada exitosamente');
    } else {
      console.log('✅ Columna profile_picture ya existe');
    }
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (err) {
    console.error('❌ Error en migración:', err);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

migrateProfilePicture();
