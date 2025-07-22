import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  let db;
  try {
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    console.log('🔧 Creando usuario de prueba...');

    // Verificar si el usuario ya existe
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', ['test']);
    
    if (existingUser) {
      console.log('✅ Usuario "test" ya existe');
    } else {
      // Crear usuario de prueba
      const hash = await bcrypt.hash('test', 10);
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['test', hash]);
      console.log('✅ Usuario "test" creado exitosamente');
    }

    // Mostrar usuarios existentes
    const users = await db.all('SELECT id, username FROM users');
    console.log('\n👥 Usuarios en la base de datos:');
    users.forEach(user => console.log(`  - ID: ${user.id}, Username: ${user.username}`));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) await db.close();
  }
}

createTestUser(); 