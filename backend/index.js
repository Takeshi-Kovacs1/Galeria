import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { query, initDatabase } from './db-config.js';
import { db } from './db-compat.js';

const app = express();
const PORT = process.env.PORT || 4002;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// Configuración de email
import { EMAIL_CONFIG, isEmailConfigured } from './email-config.js';

// Crear transportador de email solo si está configurado
let transporter;
if (isEmailConfigured()) {
  try {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('✅ Configuración de email válida');
  } catch (err) {
    console.error('❌ Error configurando email:', err);
    transporter = null;
  }
} else {
  console.log('⚠️ Email no configurado - usando valores por defecto');
  console.log('📧 Para configurar email, edita backend/email-config.js');
}

app.use(cors({
  origin: [
    'https://galeria-cyan.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  console.log('🔑 Headers:', req.headers);
  next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configuración de Multer para subir fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Inicializar directorio uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Directorio uploads creado:', uploadsDir);
} else {
  console.log('✅ Directorio uploads ya existe:', uploadsDir);
}

// Inicializar base de datos
// Inicializar base de datos PostgreSQL
(async () => {
  try {
    await initDatabase();
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos PostgreSQL:', error);
    process.exit(1);
  }
})();

// Funciones de envío de email
async function enviarEmailBienvenida(email, username, password) {
  if (!transporter) {
    console.log('⚠️ Email no configurado - no se puede enviar email de bienvenida');
    return false;
  }
  
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: email,
      subject: '¡Bienvenido a Galería Actuarial! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Bienvenido a Galería Actuarial!</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente. Aquí tienes tus credenciales:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Usuario:</strong> ${username}</p>
            <p><strong>Contraseña:</strong> ${password}</p>
          </div>
          <p>¡Disfruta compartiendo tus fotos con la comunidad!</p>
          <p>Saludos,<br>El equipo de Galería Actuarial</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return false;
  }
}

// Función de recuperación de contraseña - DESHABILITADA
async function enviarEmailRecuperacion(email, username, nuevaPassword) {
  console.log('⚠️ Función de recuperación de contraseña deshabilitada');
  return false;
}

// Middleware para autenticar JWT
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware para verificar si es admin
function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Función para registrar logs de admin
async function logAdminAction(adminId, action, targetType, targetId, details) {
  try {
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)', 
      [adminId, action, targetType, targetId, details]);
  } catch (err) {
    console.error('❌ Error registrando log de admin:', err);
  }
}

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hash]);
    
    res.json({ ok: true, message: 'Usuario registrado exitosamente.' });
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint')) {
      if (err.message.includes('username')) {
        res.status(400).json({ error: 'El nombre de usuario ya existe' });
      } else if (err.message.includes('email')) {
        res.status(400).json({ error: 'El email ya está registrado' });
      } else {
        res.status(400).json({ error: 'Usuario o email ya existe' });
      }
    } else {
      console.error('❌ Error registrando usuario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Usar query nativo de PostgreSQL en lugar de db.get
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    
    if (!user) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    
    // Verificar si el usuario está baneado
    if (user.is_banned) {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta al administrador.' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Recuperar contraseña - FUNCIONALIDAD DESHABILITADA
app.post('/api/forgot-password', async (req, res) => {
  res.status(400).json({ 
    error: 'Recuperación de contraseña deshabilitada temporalmente',
    message: 'Contacta al administrador si olvidaste tu contraseña'
  });
});

// Endpoint de prueba para verificar la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Probando conexión a la base de datos...');
    
    // Verificar que la base de datos esté disponible
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Conexión a BD exitosa:', testResult.rows[0]);
    
    // Verificar estructura de la tabla photos (PostgreSQL)
    const tableInfo = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'photos'");
    console.log('📋 Estructura de tabla photos:', tableInfo.rows);
    
    // Verificar secciones disponibles
    const sectionsResult = await query('SELECT * FROM sections LIMIT 5');
    console.log('📁 Secciones disponibles:', sectionsResult.rows);
    
    res.json({ 
      ok: true, 
      message: 'Base de datos funcionando correctamente',
      dbTest: testResult.rows[0],
      tableStructure: tableInfo.rows,
      sectionsCount: sectionsResult.rows.length
    });
  } catch (err) {
    console.error('❌ Error probando BD:', err);
    res.status(500).json({ 
      error: 'Error en la base de datos: ' + err.message,
      stack: err.stack
    });
  }
});

// Endpoint de prueba de email - DESHABILITADO
app.get('/api/test-email', async (req, res) => {
  res.status(400).json({ 
    error: 'Prueba de email deshabilitada',
    message: 'Funcionalidad de email deshabilitada temporalmente'
  });
});



// Subir foto
app.post('/api/photos', auth, upload.array('photos', 50), async (req, res) => {
  console.log('📸 Iniciando subida de fotos...');
  console.log('📁 Archivos recibidos:', req.files);
  console.log('🔑 Usuario autenticado:', req.user);
  console.log('📋 Datos del body:', req.body);
  
  const { section_id } = req.body;
  if (!req.files || req.files.length === 0) {
    console.log('❌ No se recibieron archivos');
    return res.status(400).json({ error: 'Faltan las fotos' });
  }
  if (!section_id) {
    console.log('❌ No se recibió section_id');
    return res.status(400).json({ error: 'Sección requerida' });
  }
  
  console.log('✅ Validaciones pasadas, procesando archivos...');
  
  try {
    // Insertar todas las fotos subidas
    for (const file of req.files) {
      console.log('💾 Insertando archivo:', file.filename);
      const result = await query('INSERT INTO photos (user_id, filename, title, section_id) VALUES ($1, $2, $3, $4) RETURNING id', 
        [req.user.id, file.filename, null, section_id]);
      console.log('✅ Archivo insertado con ID:', result.rows[0].id);
    }
    
    console.log('🎉 Todas las fotos subidas exitosamente');
    res.json({ 
      ok: true, 
      message: `${req.files.length} foto${req.files.length > 1 ? 's' : ''} subida${req.files.length > 1 ? 's' : ''} exitosamente` 
    });
  } catch (err) {
    console.error('❌ Error al subir fotos:', err);
    console.error('❌ Stack trace:', err.stack);
    res.status(500).json({ error: 'Error al subir fotos: ' + err.message });
  }
});

// Obtener todas las fotos con comentarios
app.get('/api/photos', async (req, res) => {
  const { section_id } = req.query;
  
  let sqlQuery = `
    SELECT photos.*, users.username, sections.name as section_name,
           (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    JOIN users ON users.id = photos.user_id 
    JOIN sections ON sections.id = photos.section_id
  `;
  
  let params = [];
  
  if (section_id) {
    sqlQuery += ' WHERE photos.section_id = $1';
    params.push(section_id);
  }
  
  sqlQuery += ' ORDER BY photos.created_at DESC';
  
  try {
    const photosResult = await query(sqlQuery, params);
    res.json(photosResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo fotos:', err);
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
});

// Obtener fotos por usuario con estadísticas
app.get('/api/user/photos', auth, async (req, res) => {
  try {
    const photosResult = await query(`
      SELECT photos.*, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
      FROM photos 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json(photosResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo fotos del usuario:', err);
    res.status(500).json({ error: 'Error al obtener fotos del usuario' });
  }
});

// Obtener estadísticas del usuario
app.get('/api/user/stats', auth, async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM photos WHERE user_id = $1) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = $1)) as total_likes
    `, [req.user.id]);
    res.json(statsResult.rows[0]);
  } catch (err) {
    console.error('❌ Error obteniendo estadísticas del usuario:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas del usuario' });
  }
});

// Votar por una foto
app.post('/api/photos/:id/vote', auth, async (req, res) => {
  try {
    const photoId = req.params.id;
    await query('INSERT INTO votes (user_id, photo_id) VALUES ($1, $2)', [req.user.id, photoId]);
    res.json({ ok: true });
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Ya votaste por esta foto' });
    } else {
      console.error('❌ Error votando por foto:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Agregar comentario
app.post('/api/photos/:id/comment', auth, async (req, res) => {
  try {
    const { comment } = req.body;
    const photoId = req.params.id;
    if (!comment || comment.trim() === '') return res.status(400).json({ error: 'Comentario requerido' });
    
    await query('INSERT INTO comments (user_id, photo_id, comment) VALUES ($1, $2, $3)', [req.user.id, photoId, comment.trim()]);
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error agregando comentario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener comentarios de una foto
app.get('/api/photos/:id/comments', async (req, res) => {
  try {
    const photoId = req.params.id;
    const commentsResult = await query(`
      SELECT comments.*, users.username 
      FROM comments 
      JOIN users ON users.id = comments.user_id 
      WHERE photo_id = $1 
      ORDER BY created_at ASC
    `, [photoId]);
    res.json(commentsResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo comentarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar foto (solo el propietario puede eliminar)
app.delete('/api/photos/:id', auth, async (req, res) => {
  console.log('🗑️ Endpoint DELETE /api/photos/:id llamado');
  console.log('📋 Parámetros:', req.params);
  console.log('🔑 Usuario autenticado:', req.user);
  
  try {
    const photoId = req.params.id;
    const userId = req.user.id;
    
    console.log('🔍 Verificando si la foto existe...');
    // Verificar que la foto existe y pertenece al usuario
    const photoResult = await query('SELECT * FROM photos WHERE id = $1 AND user_id = $2', [photoId, userId]);
    
    if (photoResult.rows.length === 0) {
      console.log('❌ Foto no encontrada o no tienes permisos');
      return res.status(404).json({ error: 'Foto no encontrada o no tienes permisos para eliminarla' });
    }
    
    const photo = photoResult.rows[0];
    console.log('✅ Foto encontrada:', photo);
    
    console.log('🗑️ Eliminando votos asociados...');
    // Eliminar votos asociados a la foto
    await query('DELETE FROM votes WHERE photo_id = $1', [photoId]);
    
    console.log('🗑️ Eliminando comentarios asociados...');
    // Eliminar comentarios asociados a la foto
    await query('DELETE FROM comments WHERE photo_id = $1', [photoId]);
    
    console.log('🗑️ Eliminando tags asociados...');
    // Eliminar tags asociados a la foto
    await query('DELETE FROM photo_tags WHERE photo_id = $1', [photoId]);
    
    console.log('🗑️ Eliminando la foto...');
    // Eliminar la foto
    await query('DELETE FROM photos WHERE id = $1', [photoId]);
    
    console.log('🗑️ Eliminando archivo físico...');
    // Eliminar el archivo físico si existe
    const filePath = path.join(process.cwd(), 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Archivo físico eliminado');
    } else {
      console.log('⚠️ Archivo físico no encontrado');
    }
    
    console.log('✅ Foto eliminada exitosamente');
    res.json({ ok: true, message: 'Foto eliminada exitosamente' });
  } catch (err) {
    console.error('❌ Error eliminando foto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Fotos más votadas (para el carrusel)
app.get('/api/photos/top', async (req, res) => {
  try {
    // Consulta simplificada para evitar problemas de tipos
    const topResult = await query(`
      SELECT 
        p.id,
        p.filename,
        p.title,
        p.created_at,
        u.username,
        s.name as section_name,
        COALESCE(v.vote_count, 0) as votes,
        COALESCE(c.comment_count, 0) as comments
      FROM photos p
      JOIN users u ON u.id = p.user_id 
      JOIN sections s ON s.id = p.section_id
      LEFT JOIN (
        SELECT photo_id, COUNT(*) as vote_count 
        FROM votes 
        GROUP BY photo_id
      ) v ON v.photo_id = p.id
      LEFT JOIN (
        SELECT photo_id, COUNT(*) as comment_count 
        FROM comments 
        GROUP BY photo_id
      ) c ON c.photo_id = p.id
      ORDER BY COALESCE(v.vote_count, 0) DESC, p.created_at DESC 
      LIMIT 10
    `);
    res.json(topResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo fotos top:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar/desmarcar foto como "apareces en esta foto"
app.post('/api/photos/:id/tag', auth, async (req, res) => {
  try {
    const photoId = req.params.id;
    
    // Verificar si ya está marcada
    const existingResult = await query('SELECT * FROM photo_tags WHERE user_id = $1 AND photo_id = $2', [req.user.id, photoId]);
    
    if (existingResult.rows.length > 0) {
      // Si ya está marcada, la desmarcamos
      await query('DELETE FROM photo_tags WHERE user_id = $1 AND photo_id = $2', [req.user.id, photoId]);
      res.json({ tagged: false });
    } else {
      // Si no está marcada, la marcamos
      await query('INSERT INTO photo_tags (user_id, photo_id) VALUES ($1, $2)', [req.user.id, photoId]);
      res.json({ tagged: true });
    }
  } catch (err) {
    console.error('❌ Error marcando/desmarcando foto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener fotos donde aparece el usuario
app.get('/api/user/tagged-photos', auth, async (req, res) => {
  try {
    const photosResult = await query(`
      SELECT photos.*, users.username, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
      FROM photos 
      JOIN users ON users.id = photos.user_id 
      JOIN photo_tags ON photo_tags.photo_id = photos.id 
      WHERE photo_tags.user_id = $1 
      ORDER BY photo_tags.created_at DESC
    `, [req.user.id]);
    res.json(photosResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo fotos marcadas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar si una foto está marcada por el usuario
app.get('/api/photos/:id/tagged', auth, async (req, res) => {
  try {
    const photoId = req.params.id;
    const taggedResult = await query('SELECT * FROM photo_tags WHERE user_id = $1 AND photo_id = $2', [req.user.id, photoId]);
    res.json({ tagged: taggedResult.rows.length > 0 });
  } catch (err) {
    console.error('❌ Error verificando si foto está marcada:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios (para búsqueda de perfiles)
app.get('/api/users', auth, async (req, res) => {
  try {
    const usersResult = await query(`
      SELECT 
        id, 
        username, 
        created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      ORDER BY username ASC
    `);
    res.json(usersResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil de un usuario específico
app.get('/api/users/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const userResult = await query(`
      SELECT 
        id, 
        username, 
        created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Obtener fotos del usuario
    const photosResult = await query(`
      SELECT photos.*, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments,
             sections.name as section_name
      FROM photos 
      JOIN sections ON sections.id = photos.section_id
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      user,
      photos: photosResult.rows
    });
  } catch (err) {
    console.error('❌ Error obteniendo perfil de usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir foto de perfil
app.post('/api/user/profile-picture', auth, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const filename = req.file.filename;
    
    // Actualizar la base de datos con el nombre del archivo
    await query('UPDATE users SET profile_picture = $1 WHERE id = $2', [filename, req.user.id]);
    
    res.json({ 
      message: 'Foto de perfil actualizada exitosamente',
      filename: filename,
      url: `/uploads/${filename}`
    });
  } catch (err) {
    console.error('❌ Error subiendo foto de perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener foto de perfil del usuario
app.get('/api/user/profile-picture', auth, async (req, res) => {
  try {
    const userResult = await query('SELECT profile_picture FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length > 0 && userResult.rows[0].profile_picture) {
      res.json({ 
        profile_picture: userResult.rows[0].profile_picture,
        url: `/uploads/${userResult.rows[0].profile_picture}`
      });
    } else {
      res.json({ profile_picture: null, url: null });
    }
  } catch (err) {
    console.error('❌ Error obteniendo foto de perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las secciones
app.get('/api/sections', async (req, res) => {
  try {
    const sectionsResult = await query('SELECT * FROM sections ORDER BY name ASC');
    res.json(sectionsResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo secciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva sección (con contraseña)
app.post('/api/sections', async (req, res) => {
  const { name, description, password } = req.body;
  
  if (!name || !password) {
    return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
  }
  
  // Verificar contraseña
  if (password !== 'Aguadelimon1') {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  
  try {
    await query('INSERT INTO sections (name, description) VALUES ($1, $2)', [name, description]);
    res.json({ ok: true, message: 'Sección creada exitosamente' });
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Ya existe una sección con ese nombre' });
    } else {
      console.error('❌ Error creando sección:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Editar sección existente (con contraseña)
app.put('/api/sections/:id', async (req, res) => {
  console.log('🔧 Endpoint PUT /api/sections/:id llamado');
  console.log('📋 Parámetros:', req.params);
  console.log('📦 Body:', req.body);
  
  const { id } = req.params;
  const { name, description, password } = req.body;
  
  if (!name || !password) {
    console.log('❌ Validación fallida: nombre o contraseña faltantes');
    return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
  }
  
  // Verificar contraseña
  if (password !== 'Aguadelimon1') {
    console.log('❌ Contraseña incorrecta');
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  
  try {
    console.log('🔍 Verificando si la sección existe...');
    // Verificar si la sección existe
    const sectionResult = await query('SELECT * FROM sections WHERE id = $1', [id]);
    if (sectionResult.rows.length === 0) {
      console.log('❌ Sección no encontrada con ID:', id);
      return res.status(404).json({ error: 'Sección no encontrada' });
    }
    
    const section = sectionResult.rows[0];
    console.log('✅ Sección encontrada:', section);
    
    // Verificar si el nuevo nombre ya existe en otra sección
    const existingSectionResult = await query('SELECT * FROM sections WHERE name = $1 AND id != $2', [name, id]);
    if (existingSectionResult.rows.length > 0) {
      console.log('❌ Ya existe una sección con ese nombre');
      return res.status(400).json({ error: 'Ya existe una sección con ese nombre' });
    }
    
    console.log('💾 Actualizando sección...');
    // Actualizar la sección
    await query('UPDATE sections SET name = $1, description = $2 WHERE id = $3', [name, description, id]);
    console.log('✅ Sección actualizada exitosamente');
    res.json({ ok: true, message: 'Sección actualizada exitosamente' });
  } catch (err) {
    console.error('❌ Error editando sección:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar sección (con contraseña)
app.delete('/api/sections/:id', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }
  
  // Verificar contraseña
  if (password !== 'Aguadelimon1') {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  
  try {
    // Verificar si la sección existe
    const sectionResult = await query('SELECT * FROM sections WHERE id = $1', [id]);
    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }
    
    // Verificar si hay fotos en esta sección
    const photosResult = await query('SELECT COUNT(*) as count FROM photos WHERE section_id = $1', [id]);
    if (parseInt(photosResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una sección que contiene fotos' });
    }
    
    // Eliminar la sección
    await query('DELETE FROM sections WHERE id = $1', [id]);
    res.json({ ok: true, message: 'Sección eliminada exitosamente' });
  } catch (err) {
    console.error('Error eliminando sección:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log('Servidor backend en http://localhost:' + PORT);
});

// ==================== ENDPOINTS DE ADMINISTRACIÓN ====================

// Dashboard de administración
app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role != 'admin') as total_users,
        (SELECT COUNT(*) FROM photos) as total_photos,
        (SELECT COUNT(*) FROM sections) as total_sections,
        (SELECT COUNT(*) FROM users WHERE is_banned = 1) as banned_users
    `);
    
    res.json({ stats: statsResult.rows[0] });
  } catch (err) {
    console.error('❌ Error obteniendo dashboard:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios (admin)
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const usersResult = await query(`
      SELECT 
        id, username, email, role, is_banned, created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `);
    res.json(usersResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil de cualquier usuario (admin)
app.get('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const userResult = await query(`
      SELECT 
        id, username, email, role, is_banned, created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE id = $1 AND role != 'admin'
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Obtener fotos del usuario
    const photosResult = await query(`
      SELECT photos.*, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments,
             sections.name as section_name
      FROM photos 
      JOIN sections ON sections.id = photos.section_id
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({ user, photos: photosResult.rows });
  } catch (err) {
    console.error('❌ Error obteniendo perfil de usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Banear/desbanear usuario (admin)
app.post('/api/admin/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_banned } = req.body;
    
    const userResult = await query('SELECT * FROM users WHERE id = $1 AND role != \'admin\'', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    await query('UPDATE users SET is_banned = $1 WHERE id = $2', [is_banned ? 1 : 0, userId]);
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, is_banned ? 'ban_user' : 'unban_user', 'user', userId, 
      `${is_banned ? 'Baneó' : 'Desbaneó'} al usuario ${user.username}`);
    
    res.json({ ok: true, message: `Usuario ${is_banned ? 'baneado' : 'desbaneado'} exitosamente` });
  } catch (err) {
    console.error('❌ Error banear/desbanear usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario (admin)
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const userResult = await query('SELECT * FROM users WHERE id = $1 AND role != \'admin\'', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Eliminar fotos del usuario
    const photosResult = await query('SELECT * FROM photos WHERE user_id = $1', [userId]);
    for (const photo of photosResult.rows) {
      // Eliminar votos, comentarios y tags
      await query('DELETE FROM votes WHERE photo_id = $1', [photo.id]);
      await query('DELETE FROM comments WHERE photo_id = $1', [photo.id]);
      await query('DELETE FROM photo_tags WHERE photo_id = $1', [photo.id]);
      
      // Eliminar archivo físico
      const filePath = path.join(process.cwd(), 'uploads', photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Eliminar fotos del usuario
    await query('DELETE FROM photos WHERE user_id = $1', [userId]);
    
    // Eliminar usuario
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, 'delete_user', 'user', userId, `Eliminó al usuario ${user.username}`);
    
    res.json({ ok: true, message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('❌ Error eliminando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las fotos del sistema (admin)
app.get('/api/admin/photos', adminAuth, async (req, res) => {
  try {
    const photosResult = await query(`
      SELECT photos.*, users.username, sections.name as section_name,
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
      FROM photos 
      JOIN users ON users.id = photos.user_id 
      JOIN sections ON sections.id = photos.section_id
      ORDER BY photos.created_at DESC
    `);
    res.json(photosResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo fotos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar cualquier foto (admin)
app.delete('/api/admin/photos/:id', adminAuth, async (req, res) => {
  try {
    const photoId = req.params.id;
    
    const photoResult = await query('SELECT photos.*, users.username FROM photos JOIN users ON users.id = photos.user_id WHERE photos.id = $1', [photoId]);
    
    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    
    const photo = photoResult.rows[0];
    
    // Eliminar votos, comentarios y tags
    await query('DELETE FROM votes WHERE photo_id = $1', [photoId]);
    await query('DELETE FROM comments WHERE photo_id = $1', [photoId]);
    await query('DELETE FROM photo_tags WHERE photo_id = $1', [photoId]);
    
    // Eliminar la foto
    await query('DELETE FROM photos WHERE id = $1', [photoId]);
    
    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, 'delete_photo', 'photo', photoId, `Eliminó foto de ${photo.username}`);
    
    res.json({ ok: true, message: 'Foto eliminada exitosamente' });
  } catch (err) {
    console.error('❌ Error eliminando foto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener logs de administración
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  try {
    const logsResult = await query(`
      SELECT admin_logs.*, users.username as admin_username
      FROM admin_logs 
      JOIN users ON users.id = admin_logs.admin_id
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    res.json(logsResult.rows);
  } catch (err) {
    console.error('❌ Error obteniendo logs:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Borrar todos los logs de administración
app.delete('/api/admin/logs/clear', adminAuth, async (req, res) => {
  try {
    // Borrar todos los logs
    await query('DELETE FROM admin_logs');
    
    // Registrar la acción de limpieza
    await logAdminAction(req.user.id, 'clear_logs', 'system', null, 'Limpió todos los logs de administración');
    
    res.json({ ok: true, message: 'Todos los logs han sido borrados exitosamente' });
  } catch (err) {
    console.error('❌ Error borrando logs:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

