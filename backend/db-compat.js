import { query } from './db-config.js';

// Función de compatibilidad para emular db.run (INSERT, UPDATE, DELETE)
export const db = {
  run: async (sql, params = []) => {
    try {
      // Convertir SQL de SQLite a PostgreSQL
      const pgSql = sql.replace(/\?/g, (match, index) => `$${index + 1}`);
      
      // Para INSERT, obtener el ID insertado
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const result = await query(pgSql + ' RETURNING id', params);
        return { lastID: result.rows[0]?.id };
      }
      
      // Para UPDATE, DELETE y otros
      const result = await query(pgSql, params);
      return { changes: result.rowCount };
    } catch (error) {
      console.error('Error en db.run:', error);
      throw error;
    }
  },

  // Función de compatibilidad para emular db.get (SELECT una fila)
  get: async (sql, params = []) => {
    try {
      const pgSql = sql.replace(/\?/g, (match, index) => `$${index + 1}`);
      const result = await query(pgSql, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error en db.get:', error);
      throw error;
    }
  },

  // Función de compatibilidad para emular db.all (SELECT múltiples filas)
  all: async (sql, params = []) => {
    try {
      const pgSql = sql.replace(/\?/g, (match, index) => `$${index + 1}`);
      const result = await query(pgSql, params);
      return result.rows;
    } catch (error) {
      console.error('Error en db.all:', error);
      throw error;
    }
  },

  // Función de compatibilidad para emular db.exec (múltiples statements)
  exec: async (sql) => {
    try {
      // Dividir múltiples statements por punto y coma
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement.trim());
        }
      }
    } catch (error) {
      console.error('Error en db.exec:', error);
      throw error;
    }
  }
};
