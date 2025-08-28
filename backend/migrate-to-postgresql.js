import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { query, initDatabase } from './db-config.js';

const migrateData = async () => {
  try {
    console.log('🔄 Iniciando migración de SQLite a PostgreSQL...');
    
    // Inicializar base de datos PostgreSQL
    await initDatabase();
    
    // Abrir base de datos SQLite
    const sqliteDb = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });
    
    console.log('📊 Migrando usuarios...');
    const users = await sqliteDb.all('SELECT * FROM users');
    for (const user of users) {
      await query(`
        INSERT INTO users (id, username, email, password, role, is_banned, profile_picture, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        is_banned = EXCLUDED.is_banned,
        profile_picture = EXCLUDED.profile_picture,
        created_at = EXCLUDED.created_at
      `, [user.id, user.username, user.email, user.password, user.role, user.is_banned, user.profile_picture, user.created_at]);
    }
    console.log(`✅ ${users.length} usuarios migrados`);
    
    console.log('📊 Migrando secciones...');
    const sections = await sqliteDb.all('SELECT * FROM sections');
    for (const section of sections) {
      await query(`
        INSERT INTO sections (id, name, description, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        created_at = EXCLUDED.created_at
      `, [section.id, section.name, section.description, section.created_at]);
    }
    console.log(`✅ ${sections.length} secciones migradas`);
    
    console.log('📊 Migrando fotos...');
    const photos = await sqliteDb.all('SELECT * FROM photos');
    for (const photo of photos) {
      await query(`
        INSERT INTO photos (id, user_id, section_id, filename, title, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        section_id = EXCLUDED.section_id,
        filename = EXCLUDED.filename,
        title = EXCLUDED.title,
        created_at = EXCLUDED.created_at
      `, [photo.id, photo.user_id, photo.section_id, photo.filename, photo.title, photo.created_at]);
    }
    console.log(`✅ ${photos.length} fotos migradas`);
    
    console.log('📊 Migrando votos...');
    const votes = await sqliteDb.all('SELECT * FROM votes');
    for (const vote of votes) {
      await query(`
        INSERT INTO votes (id, user_id, photo_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        photo_id = EXCLUDED.photo_id
      `, [vote.id, vote.user_id, vote.photo_id]);
    }
    console.log(`✅ ${votes.length} votos migrados`);
    
    console.log('📊 Migrando logs de administración...');
    const logs = await sqliteDb.all('SELECT * FROM admin_logs');
    for (const log of logs) {
      await query(`
        INSERT INTO admin_logs (id, admin_username, action, target_type, target_id, details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
        admin_username = EXCLUDED.admin_username,
        action = EXCLUDED.action,
        target_type = EXCLUDED.target_type,
        target_id = EXCLUDED.target_id,
        details = EXCLUDED.details,
        created_at = EXCLUDED.created_at
      `, [log.id, log.admin_username, log.action, log.target_type, log.target_id, log.details, log.created_at]);
    }
    console.log(`✅ ${logs.length} logs migrados`);
    
    // Cerrar conexión SQLite
    await sqliteDb.close();
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('📝 Ahora puedes usar PostgreSQL como tu base de datos principal');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export default migrateData;
