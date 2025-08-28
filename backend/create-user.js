import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function createUser() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('❌ Uso: node create-user.js <username> <password>');
    console.log('   Ejemplo: node create-user.js admin 123456');
    return;
  }

  let db;
  try {
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    console.log(`🔧 Creando usuario: ${username}`);

    // Verificar si el usuario ya existe
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUser) {
      console.log(`❌ El usuario "${username}" ya existe`);
      console.log(`   Contraseña hasheada actual: ${existingUser.password}`);
    } else {
      // Crear nuevo usuario
      const hash = await bcrypt.hash(password, 10);
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
      console.log(`✅ Usuario "${username}" creado exitosamente`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Hash generado: ${hash}`);
    }

    // Mostrar todos los usuarios
    console.log('\n👥 Todos los usuarios:');
    const users = await db.all('SELECT id, username, password FROM users');
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id})`);
      console.log(`    Hash: ${user.password}`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) await db.close();
  }
}

createUser(); 