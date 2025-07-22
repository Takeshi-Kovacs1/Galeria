import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

app.use(cors());
app.use(express.json());
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
let db;
(async () => {
  db = await open({
    filename: './galeria.sqlite',
    driver: sqlite3.Database
  });
  // Crear tablas si no existen
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      photo_id INTEGER,
      UNIQUE(user_id, photo_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(photo_id) REFERENCES photos(id)
    );
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      photo_id INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(photo_id) REFERENCES photos(id)
    );
    CREATE TABLE IF NOT EXISTS photo_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      photo_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, photo_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(photo_id) REFERENCES photos(id)
    );
  `);
})();

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

// Registro
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Usuario ya existe' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  res.json({ token });
});

// Subir foto
app.post('/api/photos', auth, upload.single('photo'), async (req, res) => {
  const { title } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Falta la foto' });
  await db.run('INSERT INTO photos (user_id, filename, title) VALUES (?, ?, ?)', [req.user.id, req.file.filename, title]);
  res.json({ ok: true });
});

// Obtener todas las fotos con comentarios
app.get('/api/photos', async (req, res) => {
  const photos = await db.all(`
    SELECT photos.*, users.username, 
           (SELECT COUNT(*) FROM votes WHERE photo_id = photos.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    JOIN users ON users.id = photos.user_id 
    ORDER BY created_at DESC
  `);
  res.json(photos);
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

// Fotos más votadas (para el carrusel)
app.get('/api/photos/top', async (req, res) => {
  const top = await db.all(`
    SELECT photos.*, users.username, 
           COUNT(votes.id) as votes,
           (SELECT COUNT(*) FROM comments WHERE photo_id = photos.id) as comments
    FROM photos 
    JOIN users ON users.id = photos.user_id 
    LEFT JOIN votes ON votes.photo_id = photos.id 
    GROUP BY photos.id 
    ORDER BY votes DESC, created_at DESC 
    LIMIT 10
  `);
  res.json(top);
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

app.listen(PORT, () => {
  console.log('Servidor backend en http://localhost:' + PORT);
}); 