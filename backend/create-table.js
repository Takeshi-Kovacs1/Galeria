import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function createPhotoTagsTable() {
  let db;
  try {
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    console.log('🔧 Creando tabla photo_tags...');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS photo_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        photo_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, photo_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(photo_id) REFERENCES photos(id)
      );
    `);

    console.log('✅ Tabla photo_tags creada exitosamente');

    // Verificar que se creó
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\n📋 Tablas existentes después de la creación:');
    tables.forEach(table => console.log(`  - ${table.name}`));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) await db.close();
  }
}

createPhotoTagsTable();
