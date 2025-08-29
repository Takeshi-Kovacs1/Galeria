import { query, initDatabase } from './db-config.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function migrateCloudinary() {
  try {
    console.log('🚀 Iniciando migración a Cloudinary...');
    
    // Verificar si la columna cloudinary_url existe
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'photos' AND column_name = 'cloudinary_url'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('📋 Agregando columna cloudinary_url a la tabla photos...');
      
      // Agregar la columna cloudinary_url
      await query(`
        ALTER TABLE photos 
        ADD COLUMN cloudinary_url TEXT
      `);
      
      console.log('✅ Columna cloudinary_url agregada exitosamente');
    } else {
      console.log('✅ La columna cloudinary_url ya existe');
    }
    
    // Verificar estructura final
    const finalStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'photos' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura final de la tabla photos:');
    finalStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateCloudinary();
