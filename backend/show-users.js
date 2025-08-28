import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

async function showUsers() {
  let db;
  try {
    db = await open({
      filename: './galeria.sqlite',
      driver: sqlite3.Database
    });

    console.log('🔍 Usuarios en la base de datos:\n');

    // Mostrar todos los usuarios con sus contraseñas hasheadas
    const users = await db.all('SELECT id, username, password FROM users');
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      users.forEach(user => {
        console.log(`👤 Usuario: ${user.username}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Contraseña hasheada: ${user.password}`);
        console.log(`   Longitud del hash: ${user.password.length} caracteres`);
        console.log('---');
      });
    }

    // Opción para crear un nuevo usuario
    console.log('\n💡 Para crear un nuevo usuario con contraseña conocida:');
    console.log('   Ejecuta: node create-user.js <username> <password>');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (db) await db.close();
  }
}

showUsers(); 