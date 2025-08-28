import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrateSections() {
  let db;
  try {
    console.log('🔄 Iniciando migración de secciones...');

    // Abrir base de datos
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    // Verificar si la tabla sections ya existe
    const tableInfo = await db.all("PRAGMA table_info(sections)");
    const hasSections = tableInfo.length > 0;

    if (!hasSections) {
      console.log('📋 Creando tabla sections...');
      await db.run(`
        CREATE TABLE IF NOT EXISTS sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verificar si la columna section_id ya existe en photos
    const photosTableInfo = await db.all("PRAGMA table_info(photos)");
    const hasSectionId = photosTableInfo.some(col => col.name === 'section_id');

    if (!hasSectionId) {
      console.log('🔗 Agregando columna section_id a la tabla photos...');
      await db.run('ALTER TABLE photos ADD COLUMN section_id INTEGER');
    }

    // Crear secciones por defecto
    const defaultSections = [
      { name: 'Graduación', description: 'Fotos de graduación' },
      { name: 'Papu Fest v.1', description: 'Primera edición del Papu Fest' },
      { name: 'General', description: 'Fotos generales de la galería' }
    ];

    console.log('📸 Creando secciones por defecto...');
    for (const section of defaultSections) {
      try {
        await db.run('INSERT INTO sections (name, description) VALUES (?, ?)', [section.name, section.description]);
        console.log(`✅ Sección "${section.name}" creada`);
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log(`ℹ️ La sección "${section.name}" ya existe`);
        } else {
          console.error(`❌ Error creando sección "${section.name}":`, err.message);
        }
      }
    }

    // Asignar fotos existentes a la sección "General"
    const generalSection = await db.get('SELECT id FROM sections WHERE name = ?', ['General']);
    if (generalSection) {
      console.log('🔄 Asignando fotos existentes a la sección General...');
      await db.run('UPDATE photos SET section_id = ? WHERE section_id IS NULL', [generalSection.id]);
      console.log('✅ Fotos existentes asignadas a la sección General');
    }

    console.log('✅ Migración de secciones completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

migrateSections();
