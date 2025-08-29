import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'galeria_actuaria',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Función para obtener una conexión del pool
export const getConnection = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('❌ Error obteniendo conexión a la base de datos:', error);
    throw error;
  }
};

// Función para ejecutar queries
export const query = async (text, params) => {
  const client = await getConnection();
  try {
    // Si no hay parámetros, ejecutar directamente
    if (!params || params.length === 0) {
      const result = await client.query(text);
      return result;
    }
    
    // Si hay parámetros, usar query con parámetros
    // PostgreSQL puede inferir tipos automáticamente en la mayoría de casos
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Función para inicializar la base de datos
export const initDatabase = async () => {
  try {
    console.log('🗄️ Inicializando base de datos PostgreSQL...');
    
    // Crear tablas si no existen
    await query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        is_banned BOOLEAN DEFAULT FALSE,
        profile_picture VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
        filename VARCHAR(255),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
        UNIQUE(user_id, photo_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS photo_tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, photo_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100),
        target_type VARCHAR(50),
        target_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar secciones por defecto si no existen
    const sectionsResult = await query('SELECT COUNT(*) FROM sections');
    if (parseInt(sectionsResult.rows[0].count) === 0) {
      console.log('📁 Insertando secciones por defecto...');
      await query(`
        INSERT INTO sections (name, description) VALUES 
        ('Naturaleza', 'Fotos de paisajes naturales, plantas y animales'),
        ('Urbano', 'Fotos de ciudades, edificios y vida urbana'),
        ('Retratos', 'Fotos de personas y retratos'),
        ('Arte', 'Fotos artísticas y creativas'),
        ('Viajes', 'Fotos de viajes y lugares turísticos')
        ON CONFLICT (name) DO NOTHING;
      `);
    }

    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
};

// Función para cerrar el pool
export const closePool = async () => {
  await pool.end();
};

export default pool;
