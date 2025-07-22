import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkDatabase() {
  let db;
  try {
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    console.log('🔍 Verificando base de datos...\n');

    // Verificar tablas existentes
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Tablas existentes:');
    tables.forEach(table => console.log(`  - ${table.name}`));

    // Verificar estructura de photo_tags
    console.log('\n📊 Estructura de photo_tags:');
    const photoTagsStructure = await db.all("PRAGMA table_info(photo_tags)");
    photoTagsStructure.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Verificar datos en photo_tags
    console.log('\n📈 Datos en photo_tags:');
    const photoTagsData = await db.all("SELECT * FROM photo_tags");
    if (photoTagsData.length === 0) {
      console.log('  - No hay datos en photo_tags');
    } else {
      photoTagsData.forEach(row => console.log(`  - ID: ${row.id}, User: ${row.user_id}, Photo: ${row.photo_id}`));
    }

    // Verificar usuarios
    console.log('\n👥 Usuarios:');
    const users = await db.all("SELECT id, username FROM users");
    users.forEach(user => console.log(`  - ID: ${user.id}, Username: ${user.username}`));

    // Verificar fotos
    console.log('\n🖼️ Fotos:');
    const photos = await db.all("SELECT id, title, user_id FROM photos LIMIT 5");
    photos.forEach(photo => console.log(`  - ID: ${photo.id}, Title: ${photo.title}, User: ${photo.user_id}`));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) await db.close();
  }
}

checkDatabase(); 