import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrateDatabase() {
  let db;
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Abrir base de datos
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });
    
    // Verificar si la columna email ya existe
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasEmail = tableInfo.some(col => col.name === 'email');
    
    if (hasEmail) {
      console.log('✅ La columna email ya existe en la tabla users');
      return;
    }
    
    // Agregar columna email
    console.log('📧 Agregando columna email a la tabla users...');
    await db.run('ALTER TABLE users ADD COLUMN email TEXT');
    
    // Crear índice único para email
    console.log('🔑 Creando índice único para email...');
    await db.run('CREATE UNIQUE INDEX idx_users_email ON users(email)');
    
    console.log('✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

migrateDatabase(); 