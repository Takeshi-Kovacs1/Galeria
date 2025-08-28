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
const PORT = process.env.PORT || 4001;
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
    await db.run('INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)', 
      [adminId, action, targetType, targetId, details]);
  } catch (err) {
    console.error('Error registrando log de admin:', err);
  }
}

// Registro
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }
  
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);
    
    res.json({ ok: true, message: 'Usuario registrado exitosamente.' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      if (err.message.includes('username')) {
        res.status(400).json({ error: 'El nombre de usuario ya existe' });
      } else if (err.message.includes('email')) {
        res.status(400).json({ error: 'El email ya está registrado' });
      } else {
        res.status(400).json({ error: 'Usuario o email ya existe' });
      }
    } else {
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
    const testResult = await db.get('SELECT 1 as test');
    console.log('✅ Conexión a BD exitosa:', testResult);
    
    // Verificar estructura de la tabla photos
    const tableInfo = await db.all("PRAGMA table_info(photos)");
    console.log('📋 Estructura de tabla photos:', tableInfo);
    
    // Verificar secciones disponibles
    const sections = await db.all('SELECT * FROM sections LIMIT 5');
    console.log('📁 Secciones disponibles:', sections);
    
    res.json({ 
      ok: true, 
      message: 'Base de datos funcionando correctamente',
      dbTest: testResult,
      tableStructure: tableInfo,
      sectionsCount: sections.length
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
      const result = await db.run('INSERT INTO photos (user_id, filename, title, section_id) VALUES (?, ?, ?, ?)', 
        [req.user.id, file.filename, null, section_id]);
      console.log('✅ Archivo insertado con ID:', result.lastID);
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
  
  let query = `
    SELECT photos.*, users.username, sections.name as section_name,
           (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    JOIN users ON users.id = photos.user_id 
    JOIN sections ON sections.id = photos.section_id
  `;
  
  let params = [];
  
  if (section_id) {
    query += ' WHERE photos.section_id = ?';
    params.push(section_id);
  }
  
  query += ' ORDER BY photos.created_at DESC';
  
  try {
    const photos = await db.all(query, params);
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
});

// Obtener fotos por usuario con estadísticas
app.get('/api/user/photos', auth, async (req, res) => {
  const photos = await db.all(`
    SELECT photos.*, 
           (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [req.user.id]);
  res.json(photos);
});

// Obtener estadísticas del usuario
app.get('/api/user/stats', auth, async (req, res) => {
  const stats = await db.get(`
    SELECT 
      (SELECT COUNT(*) FROM photos WHERE user_id = ?) as total_photos,
      (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = ?)) as total_likes
  `, [req.user.id, req.user.id]);
  res.json(stats);
});

// Votar por una foto
app.post('/api/photos/:id/vote', auth, async (req, res) => {
  const photoId = req.params.id;
  try {
    await db.run('INSERT INTO votes (user_id, photo_id) VALUES (?, ?)', [req.user.id, photoId]);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Ya votaste por esta foto' });
  }
});

// Agregar comentario
app.post('/api/photos/:id/comment', auth, async (req, res) => {
  const { comment } = req.body;
  const photoId = req.params.id;
  if (!comment || comment.trim() === '') return res.status(400).json({ error: 'Comentario requerido' });
  try {
    await db.run('INSERT INTO comments (user_id, photo_id, comment) VALUES (?, ?, ?)', [req.user.id, photoId, comment.trim()]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
});

// Obtener comentarios de una foto
app.get('/api/photos/:id/comments', async (req, res) => {
  const photoId = req.params.id;
  const comments = await db.all(`
    SELECT comments.*, users.username 
    FROM comments 
    JOIN users ON users.id = comments.user_id 
    WHERE photo_id = ? 
    ORDER BY created_at ASC
  `, [photoId]);
  res.json(comments);
});

// Eliminar foto (solo el propietario puede eliminar)
app.delete('/api/photos/:id', auth, async (req, res) => {
  console.log('🗑️ Endpoint DELETE /api/photos/:id llamado');
  console.log('📋 Parámetros:', req.params);
  console.log('🔑 Usuario autenticado:', req.user);
  
  const photoId = req.params.id;
  const userId = req.user.id;
  
  try {
    console.log('🔍 Verificando si la foto existe...');
    // Verificar que la foto existe y pertenece al usuario
    const photo = await db.get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [photoId, userId]);
    
    if (!photo) {
      console.log('❌ Foto no encontrada o no tienes permisos');
      return res.status(404).json({ error: 'Foto no encontrada o no tienes permisos para eliminarla' });
    }
    
    console.log('✅ Foto encontrada:', photo);
    
    console.log('🗑️ Eliminando votos asociados...');
    // Eliminar votos asociados a la foto
    await db.run('DELETE FROM votes WHERE photo_id = ?', [photoId]);
    
    console.log('🗑️ Eliminando comentarios asociados...');
    // Eliminar comentarios asociados a la foto
    await db.run('DELETE FROM comments WHERE photo_id = ?', [photoId]);
    
    console.log('🗑️ Eliminando tags asociados...');
    // Eliminar tags asociados a la foto
    await db.run('DELETE FROM photo_tags WHERE photo_id = ?', [photoId]);
    
    console.log('🗑️ Eliminando la foto...');
    // Eliminar la foto
    await db.run('DELETE FROM photos WHERE id = ?', [photoId]);
    
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
    const top = await db.all(`
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
    res.json(top);
  } catch (err) {
    console.error('Error obteniendo fotos top:', err);
    res.status(500).json({ error: 'Error al obtener fotos top' });
  }
});

// Marcar/desmarcar foto como "apareces en esta foto"
app.post('/api/photos/:id/tag', auth, async (req, res) => {
  const photoId = req.params.id;
  try {
    // Verificar si ya está marcada
    const existing = await db.get('SELECT * FROM photo_tags WHERE user_id = ? AND photo_id = ?', [req.user.id, photoId]);
    
    if (existing) {
      // Si ya está marcada, la desmarcamos
      await db.run('DELETE FROM photo_tags WHERE user_id = ? AND photo_id = ?', [req.user.id, photoId]);
      res.json({ tagged: false });
    } else {
      // Si no está marcada, la marcamos
      await db.run('INSERT INTO photo_tags (user_id, photo_id) VALUES (?, ?)', [req.user.id, photoId]);
      res.json({ tagged: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar/desmarcar foto' });
  }
});

// Obtener fotos donde aparece el usuario
app.get('/api/user/tagged-photos', auth, async (req, res) => {
  const photos = await db.all(`
    SELECT photos.*, users.username, 
           (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    JOIN users ON users.id = photos.user_id 
    JOIN photo_tags ON photo_tags.photo_id = photos.id 
    WHERE photo_tags.user_id = ? 
    ORDER BY photo_tags.created_at DESC
  `, [req.user.id]);
  res.json(photos);
});

// Verificar si una foto está marcada por el usuario
app.get('/api/photos/:id/tagged', auth, async (req, res) => {
  const photoId = req.params.id;
  const tagged = await db.get('SELECT * FROM photo_tags WHERE user_id = ? AND photo_id = ?', [req.user.id, photoId]);
  res.json({ tagged: !!tagged });
});

// Obtener todos los usuarios (para búsqueda de perfiles)
app.get('/api/users', auth, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT 
        id, 
        username, 
        created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      ORDER BY username ASC
    `);
    res.json(users);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener perfil de un usuario específico
app.get('/api/users/:id', auth, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await db.get(`
      SELECT 
        id, 
        username, 
        created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Obtener fotos del usuario
    const photos = await db.all(`
      SELECT photos.*, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments,
             sections.name as section_name
      FROM photos 
      JOIN sections ON sections.id = photos.section_id
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      user,
      photos
    });
  } catch (err) {
    console.error('Error obteniendo perfil de usuario:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
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
    await db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [filename, req.user.id]);
    
    res.json({ 
      message: 'Foto de perfil actualizada exitosamente',
      filename: filename,
      url: `/uploads/${filename}`
    });
  } catch (err) {
    console.error('Error subiendo foto de perfil:', err);
    res.status(500).json({ error: 'Error al subir foto de perfil' });
  }
});

// Obtener foto de perfil del usuario
app.get('/api/user/profile-picture', auth, async (req, res) => {
  try {
    const user = await db.get('SELECT profile_picture FROM users WHERE id = ?', [req.user.id]);
    
    if (user && user.profile_picture) {
      res.json({ 
        profile_picture: user.profile_picture,
        url: `/uploads/${user.profile_picture}`
      });
    } else {
      res.json({ profile_picture: null, url: null });
    }
  } catch (err) {
    console.error('Error obteniendo foto de perfil:', err);
    res.status(500).json({ error: 'Error al obtener foto de perfil' });
  }
});

// Obtener todas las secciones
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await db.all('SELECT * FROM sections ORDER BY name ASC');
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener secciones' });
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
    await db.run('INSERT INTO sections (name, description) VALUES (?, ?)', [name, description]);
    res.json({ ok: true, message: 'Sección creada exitosamente' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Ya existe una sección con ese nombre' });
    } else {
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
    const section = await db.get('SELECT * FROM sections WHERE id = ?', [id]);
    if (!section) {
      console.log('❌ Sección no encontrada con ID:', id);
      return res.status(404).json({ error: 'Sección no encontrada' });
    }
    
    console.log('✅ Sección encontrada:', section);
    
    // Verificar si el nuevo nombre ya existe en otra sección
    const existingSection = await db.get('SELECT * FROM sections WHERE name = ? AND id != ?', [name, id]);
    if (existingSection) {
      console.log('❌ Ya existe una sección con ese nombre');
      return res.status(400).json({ error: 'Ya existe una sección con ese nombre' });
    }
    
    console.log('💾 Actualizando sección...');
    // Actualizar la sección
    await db.run('UPDATE sections SET name = ?, description = ? WHERE id = ?', [name, description, id]);
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
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role != 'admin') as total_users,
        (SELECT COUNT(*) FROM photos) as total_photos,
        (SELECT COUNT(*) FROM sections) as total_sections,
        (SELECT COUNT(*) FROM users WHERE is_banned = 1) as banned_users
    `);
    
    res.json({ stats });
  } catch (err) {
    console.error('Error obteniendo dashboard:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios (admin)
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT 
        id, username, email, role, is_banned, created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil de cualquier usuario (admin)
app.get('/api/admin/users/:id', adminAuth, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await db.get(`
      SELECT 
        id, username, email, role, is_banned, created_at,
        (SELECT COUNT(*) FROM photos WHERE user_id = users.id) as total_photos,
        (SELECT COUNT(*) FROM votes WHERE photo_id IN (SELECT id FROM photos WHERE user_id = users.id)) as total_likes
      FROM users 
      WHERE id = ? AND role != 'admin'
    `, [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Obtener fotos del usuario
    const photos = await db.all(`
      SELECT photos.*, 
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments,
             sections.name as section_name
      FROM photos 
      JOIN sections ON sections.id = photos.section_id
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({ user, photos });
  } catch (err) {
    console.error('Error obteniendo perfil de usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Banear/desbanear usuario (admin)
app.post('/api/admin/users/:id/ban', adminAuth, async (req, res) => {
  const userId = req.params.id;
  const { is_banned } = req.body;
  
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ? AND role != "admin"', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await db.run('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned ? 1 : 0, userId]);
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, is_banned ? 'ban_user' : 'unban_user', 'user', userId, 
      `${is_banned ? 'Baneó' : 'Desbaneó'} al usuario ${user.username}`);
    
    res.json({ ok: true, message: `Usuario ${is_banned ? 'baneado' : 'desbaneado'} exitosamente` });
  } catch (err) {
    console.error('Error banear/desbanear usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario (admin)
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ? AND role != "admin"', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar fotos del usuario
    const photos = await db.all('SELECT * FROM photos WHERE user_id = ?', [userId]);
    for (const photo of photos) {
      // Eliminar votos, comentarios y tags
      await db.run('DELETE FROM votes WHERE photo_id = ?', [photo.id]);
      await db.run('DELETE FROM comments WHERE photo_id = ?', [photo.id]);
      await db.run('DELETE FROM photo_tags WHERE photo_id = ?', [photo.id]);
      
      // Eliminar archivo físico
      const filePath = path.join(process.cwd(), 'uploads', photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Eliminar fotos del usuario
    await db.run('DELETE FROM photos WHERE user_id = ?', [userId]);
    
    // Eliminar usuario
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, 'delete_user', 'user', userId, `Eliminó al usuario ${user.username}`);
    
    res.json({ ok: true, message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las fotos del sistema (admin)
app.get('/api/admin/photos', adminAuth, async (req, res) => {
  try {
    const photos = await db.all(`
      SELECT photos.*, users.username, sections.name as section_name,
             (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
             (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
      FROM photos 
      JOIN users ON users.id = photos.user_id 
      JOIN sections ON sections.id = photos.section_id
      ORDER BY photos.created_at DESC
    `);
    res.json(photos);
  } catch (err) {
    console.error('Error obteniendo fotos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar cualquier foto (admin)
app.delete('/api/admin/photos/:id', adminAuth, async (req, res) => {
  const photoId = req.params.id;
  
  try {
    const photo = await db.get('SELECT photos.*, users.username FROM photos JOIN users ON users.id = photos.user_id WHERE photos.id = ?', [photoId]);
    
    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    
    // Eliminar votos, comentarios y tags
    await db.run('DELETE FROM votes WHERE photo_id = ?', [photoId]);
    await db.run('DELETE FROM comments WHERE photo_id = ?', [photoId]);
    await db.run('DELETE FROM photo_tags WHERE photo_id = ?', [photoId]);
    
    // Eliminar la foto
    await db.run('DELETE FROM photos WHERE id = ?', [photoId]);
    
    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Registrar acción en logs
    await logAdminAction(req.user.id, 'delete_photo', 'photo', photoId, `Eliminó foto de ${photo.username}`);
    
    res.json({ ok: true, message: 'Foto eliminada exitosamente' });
  } catch (err) {
    console.error('Error eliminando foto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener logs de administración
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  try {
    const logs = await db.all(`
      SELECT admin_logs.*, users.username as admin_username
      FROM admin_logs 
      JOIN users ON users.id = admin_logs.admin_id
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error obteniendo logs:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Borrar todos los logs de administración
app.delete('/api/admin/logs/clear', adminAuth, async (req, res) => {
  try {
    // Borrar todos los logs
    await db.run('DELETE FROM admin_logs');
    
    // Registrar la acción de limpieza
    await logAdminAction(req.user.id, 'clear_logs', 'system', null, 'Limpió todos los logs de administración');
    
    res.json({ ok: true, message: 'Todos los logs han sido borrados exitosamente' });
  } catch (err) {
    console.error('Error borrando logs:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

