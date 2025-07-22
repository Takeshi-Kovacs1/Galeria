import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import { FaCamera } from 'react-icons/fa';
import { FaImages, FaUser, FaSignOutAlt, FaHeart, FaDownload, FaCheckSquare, FaSquare, FaUserTag } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4001/api';
const UPLOADS_URL = process.env.REACT_APP_UPLOADS_URL || 'http://localhost:4001/uploads';

const Carrusel = React.memo(({ fotos, visibleVista }) => {
  const [start, setStart] = useState(0);
  const [anim, setAnim] = useState('');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const visible = 5;
  const topFotos = useMemo(() => fotos.slice(0, 10), [fotos]);
  const total = topFotos.length;

  useEffect(() => { setStart(0); }, [fotos]);

  // Carrusel automático más fluido
  useEffect(() => {
    if (!isAutoPlaying || total <= visible) return;

    const interval = setInterval(() => {
      setAnim('slide-left');
      setTimeout(() => {
        setStart(s => {
          const newStart = s + 1;
          return newStart >= total - visible ? 0 : newStart; // Volver al inicio cuando llegue al final
        });
        setAnim('');
      }, 500); // Animación más larga para mayor fluidez
    }, 3000); // Cambiar cada 3 segundos para más dinamismo

    return () => clearInterval(interval);
  }, [isAutoPlaying, total, visible]);

  // Pausar el carrusel automático cuando el usuario interactúa
  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    // Reanudar después de 10 segundos de inactividad
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const next = useCallback(() => {
    if (start < total - visible) {
      pauseAutoPlay();
      setAnim('slide-left');
      setTimeout(() => {
        setStart(s => Math.min(s + 1, total - visible));
        setAnim('');
      }, 500);
    }
  }, [start, total, visible, pauseAutoPlay]);

  const prev = useCallback(() => {
    if (start > 0) {
      pauseAutoPlay();
      setAnim('slide-right');
      setTimeout(() => {
        setStart(s => Math.max(s - 1, 0));
        setAnim('');
      }, 500);
    }
  }, [start, pauseAutoPlay]);

  // Efecto de movimiento con el mouse
  const handleMouseMove = useCallback((e, idx) => {
    pauseAutoPlay();
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const moveX = ((x / rect.width) - 0.5) * 16;
    const moveY = ((y / rect.height) - 0.5) * 16;
    card.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.04)`;
  }, [pauseAutoPlay]);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = '';
  }, []);

  if (total < 1 || visibleVista !== 'galeria') {
    // No renderizar nada si no hay fotos o la vista no es galería
    return null;
  }

  const fotosVisibles = topFotos.slice(start, start + visible);
  while (fotosVisibles.length < visible) fotosVisibles.push(null);

  return (
    <div className="carrusel-multi-full">
      <button className="carrusel-btn" onClick={prev} aria-label="Anterior" disabled={start === 0}>&#8592;</button>
      <div className={`carrusel-fotos carrusel-anim-${anim}`}>
        {fotosVisibles.map((foto, i) => foto ? (
          <div
            className="carrusel-foto"
            key={foto.id}
            onMouseMove={e => handleMouseMove(e, i)}
            onMouseLeave={handleMouseLeave}
          >
            <img src={UPLOADS_URL + '/' + foto.filename} alt={foto.title} loading="lazy" />
            <div className="carrusel-info">
              <b>{foto.title}</b>
              <span>{foto.votes} votos</span>
            </div>
          </div>
        ) : <div className="carrusel-foto carrusel-foto-vacia" key={i}></div>)}
      </div>
      <button className="carrusel-btn" onClick={next} aria-label="Siguiente" disabled={start >= total - visible}>&#8594;</button>
      
      {/* Indicador de modo automático */}
      {total > visible && (
        <div className="carrusel-auto-indicator">
          <div className={`carrusel-dot ${isAutoPlaying ? 'active' : ''}`}></div>
          <span className="carrusel-auto-text">
            {isAutoPlaying ? 'Automático' : 'Pausado'}
          </span>
        </div>
      )}
    </div>
  );
});

const Login = React.memo(({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    setError('');
    try {
      const url = isRegister ? '/register' : '/login';
      const res = await axios.post(API + url, { username, password });
      if (isRegister) setIsRegister(false);
      else setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  }, [isRegister, setToken]);

  return (
    <div className="login-box">
      <h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">{isRegister ? 'Registrarse' : 'Entrar'}</button>
      </form>
      <button className="link" onClick={()=>setIsRegister(r=>!r)}>
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
});

const Galeria = React.memo(({ fotos, onVotar, usuarioId }) => {
  const [fotosMarcadas, setFotosMarcadas] = useState(new Set());
  const [fotosVotadas, setFotosVotadas] = useState(new Set());

  // Cargar fotos marcadas al montar el componente
  useEffect(() => {
    if (usuarioId) {
      const cargarFotosMarcadas = async () => {
        try {
          const promises = fotos.map(foto => 
            axios.get(API + `/photos/${foto.id}/tagged`, { 
              headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } 
            })
          );
          const responses = await Promise.all(promises);
          const marcadas = new Set();
          responses.forEach((response, index) => {
            if (response.data.tagged) {
              marcadas.add(fotos[index].id);
            }
          });
          setFotosMarcadas(marcadas);
        } catch (err) {
          console.error('Error cargando fotos marcadas:', err);
        }
      };
      cargarFotosMarcadas();
    }
  }, [fotos, usuarioId]);

  const marcarFoto = useCallback(async (fotoId) => {
    if (!usuarioId) return;
    
    try {
      const response = await axios.post(API + `/photos/${fotoId}/tag`, {}, { 
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } 
      });
      
      setFotosMarcadas(prev => {
        const nuevo = new Set(prev);
        if (response.data.tagged) {
          nuevo.add(fotoId);
        } else {
          nuevo.delete(fotoId);
        }
        return nuevo;
      });
    } catch (err) {
      console.error('Error marcando foto:', err);
    }
  }, [usuarioId]);

  const handleVotar = useCallback(async (fotoId) => {
    if (!usuarioId) return;
    
    try {
      await onVotar(fotoId);
      // Cambiar el estado local del voto
      setFotosVotadas(prev => {
        const nuevo = new Set(prev);
        if (nuevo.has(fotoId)) {
          nuevo.delete(fotoId);
        } else {
          nuevo.add(fotoId);
        }
        return nuevo;
      });
    } catch (err) {
      console.error('Error votando:', err);
    }
  }, [usuarioId, onVotar]);

  return (
    <div className="galeria">
      {fotos.map(foto => (
        <div className="foto" key={foto.id}>
          <img src={UPLOADS_URL + '/' + foto.filename} alt={foto.title} loading="lazy" />
          <div className="foto-info">
            <b>{foto.title}</b>
            <span>por {foto.username}</span>
            <span>{foto.votes} votos</span>
            <div className="foto-actions">
              {usuarioId && (
                <button 
                  className={`foto-vote-btn ${fotosVotadas.has(foto.id) ? 'voted' : ''}`}
                  onClick={() => handleVotar(foto.id)}
                >
                  Votar
                </button>
              )}
              {usuarioId && (
                <button 
                  className={`foto-tag-btn ${fotosMarcadas.has(foto.id) ? 'tagged' : ''}`}
                  onClick={() => marcarFoto(foto.id)}
                  title={fotosMarcadas.has(foto.id) ? "Ya apareces en esta foto" : "Marcar como 'Apareces en esta foto'"}
                >
                  <FaUserTag />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const SubirFoto = React.memo(({ token, onSubida }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) return setError('Selecciona una foto');
    const form = new FormData();
    form.append('title', title);
    form.append('photo', file);
    try {
      await axios.post(API + '/photos', form, { headers: { Authorization: 'Bearer ' + token } });
      setTitle(''); 
      setFile(null); 
      setSuccess('¡Foto subida exitosamente! 📸');
      onSubida();
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al subir');
    }
  }, [file, title, token, onSubida]);

  return (
    <form className="subir-foto" onSubmit={handleSubmit}>
      <input placeholder="Título de la foto" value={title} onChange={e=>setTitle(e.target.value)} required />
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} required />
      <button type="submit">Subir foto</button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </form>
  );
});

const Perfil = React.memo(({ token }) => {
  const [fotos, setFotos] = useState([]);
  const [fotosMarcadas, setFotosMarcadas] = useState([]);
  const [usuario, setUsuario] = useState({ username: '', id: '' });
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [cambiarPerfil, setCambiarPerfil] = useState(false);
  const [stats, setStats] = useState({ total_photos: 0, total_likes: 0 });
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState(new Set());
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [vistaPerfil, setVistaPerfil] = useState('mis-fotos'); // 'mis-fotos' o 'donde-aparezco'
  const fileInputRef = React.useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fotosRes, statsRes, fotosMarcadasRes] = await Promise.all([
          axios.get(API + '/user/photos', { headers: { Authorization: 'Bearer ' + token } }),
          axios.get(API + '/user/stats', { headers: { Authorization: 'Bearer ' + token } }),
          axios.get(API + '/user/tagged-photos', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        
        setFotos(fotosRes.data);
        setStats(statsRes.data);
        setFotosMarcadas(fotosMarcadasRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    const payload = JSON.parse(atob(token.split('.')[1]));
    setUsuario(payload);
    setFotoPerfil(localStorage.getItem('fotoPerfil_' + payload.id) || '');
    fetchData();
  }, [token]);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new window.Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (img.width > img.height) {
          sx = (img.width - img.height) / 2;
          sw = sh = img.height;
        } else if (img.height > img.width) {
          sy = (img.height - img.width) / 2;
          sw = sh = img.width;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64Length = dataUrl.length * 3 / 4 - (dataUrl.endsWith('==') ? 2 : dataUrl.endsWith('=') ? 1 : 0);
        if (base64Length > 400 * 1024) {
          alert('La imagen de perfil es demasiado grande. Usa una imagen más pequeña.');
          return;
        }
        setFotoPerfil(dataUrl);
        localStorage.setItem('fotoPerfil_' + usuario.id, dataUrl);
      };
      img.onerror = function() {
        alert('No se pudo procesar la imagen.');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [usuario.id]);

  const fotoPerfilSrc = useMemo(() => {
    if (fotoPerfil && fotoPerfil.startsWith('data:')) {
      return fotoPerfil;
    } else if (fotoPerfil) {
      return UPLOADS_URL + '/' + fotoPerfil;
    } else {
      return `https://api.dicebear.com/8.x/identicon/svg?seed=${usuario.username}`;
    }
  }, [fotoPerfil, usuario.username]);

  // Funciones para selección múltiple
  const toggleSeleccion = useCallback((fotoId) => {
    setFotosSeleccionadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(fotoId)) {
        nuevo.delete(fotoId);
      } else {
        nuevo.add(fotoId);
      }
      return nuevo;
    });
  }, []);

  const seleccionarTodo = useCallback(() => {
    const fotosActuales = vistaPerfil === 'mis-fotos' ? fotos : fotosMarcadas;
    setFotosSeleccionadas(new Set(fotosActuales.map(f => f.id)));
  }, [fotos, fotosMarcadas, vistaPerfil]);

  const deseleccionarTodo = useCallback(() => {
    setFotosSeleccionadas(new Set());
  }, []);

  const salirModoSeleccion = useCallback(() => {
    setModoSeleccion(false);
    setFotosSeleccionadas(new Set());
  }, []);

  // Función para descargar imágenes seleccionadas
  const descargarSeleccionadas = useCallback(async () => {
    if (fotosSeleccionadas.size === 0) {
      alert('Selecciona al menos una foto para descargar');
      return;
    }

    try {
      // Crear un ZIP usando JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const fotosActuales = vistaPerfil === 'mis-fotos' ? fotos : fotosMarcadas;
      const fotosParaDescargar = fotosActuales.filter(f => fotosSeleccionadas.has(f.id));
      
      // Descargar cada imagen y agregarla al ZIP
      for (const foto of fotosParaDescargar) {
        try {
          const response = await fetch(UPLOADS_URL + '/' + foto.filename);
          const blob = await response.blob();
          zip.file(foto.title + '.jpg', blob);
        } catch (err) {
          console.error(`Error descargando ${foto.title}:`, err);
        }
      }

      // Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fotos_${usuario.username}_${vistaPerfil}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Salir del modo selección
      salirModoSeleccion();
    } catch (err) {
      console.error('Error creando ZIP:', err);
      alert('Error al crear el archivo ZIP. Intenta de nuevo.');
    }
  }, [fotosSeleccionadas, fotos, fotosMarcadas, usuario.username, vistaPerfil, salirModoSeleccion]);

  const fotosActuales = vistaPerfil === 'mis-fotos' ? fotos : fotosMarcadas;

  return (
    <div className="perfil-ig">
      <div className="perfil-ig-header">
        <div className="perfil-ig-foto" onMouseEnter={()=>setCambiarPerfil(true)} onMouseLeave={()=>setCambiarPerfil(false)}>
          <img src={fotoPerfilSrc} alt="Foto de perfil" loading="lazy" />
          <input type="file" accept="image/*" style={{display:'none'}} ref={fileInputRef} onChange={handleFileChange} />
          {cambiarPerfil && (
            <div className="perfil-ig-foto-cam" onClick={()=>fileInputRef.current.click()} title="Cambiar foto de perfil">
              <FaCamera size={32} />
            </div>
          )}
        </div>
        <div className="perfil-ig-info">
          <h2>@{usuario.username}</h2>
          <div className="perfil-ig-stats">
            <span>{stats.total_photos} publicaciones</span>
            <span>{stats.total_likes} likes totales</span>
            <span>{fotosMarcadas.length} fotos donde aparezco</span>
          </div>
        </div>
      </div>

      {/* Pestañas para alternar entre vistas */}
      <div className="perfil-ig-tabs">
        <button 
          className={`perfil-ig-tab ${vistaPerfil === 'mis-fotos' ? 'activo' : ''}`}
          onClick={() => setVistaPerfil('mis-fotos')}
        >
          Mis fotos ({fotos.length})
        </button>
        <button 
          className={`perfil-ig-tab ${vistaPerfil === 'donde-aparezco' ? 'activo' : ''}`}
          onClick={() => setVistaPerfil('donde-aparezco')}
        >
          Donde aparezco ({fotosMarcadas.length})
        </button>
        {!modoSeleccion && (
          <button 
            className="perfil-ig-descargar-btn" 
            onClick={() => setModoSeleccion(true)}
            title="Descargar múltiples fotos"
          >
            <FaDownload /> Descargar fotos
          </button>
        )}
      </div>

      {modoSeleccion && (
        <div className="perfil-ig-seleccion-controls">
          <div className="perfil-ig-seleccion-info">
            <span>{fotosSeleccionadas.size} de {fotosActuales.length} fotos seleccionadas</span>
          </div>
          <div className="perfil-ig-seleccion-buttons">
            <button onClick={seleccionarTodo} disabled={fotosSeleccionadas.size === fotosActuales.length}>
              Seleccionar todo
            </button>
            <button onClick={deseleccionarTodo} disabled={fotosSeleccionadas.size === 0}>
              Deseleccionar todo
            </button>
            <button 
              onClick={descargarSeleccionadas} 
              disabled={fotosSeleccionadas.size === 0}
              className="perfil-ig-descargar-btn-activo"
            >
              <FaDownload /> Descargar ({fotosSeleccionadas.size})
            </button>
            <button onClick={salirModoSeleccion} className="perfil-ig-cancelar-btn">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="perfil-ig-galeria perfil-ig-galeria-grande">
        {fotosActuales.length === 0 ? (
          <div className="perfil-ig-empty-state">
            <h3>
              {vistaPerfil === 'mis-fotos' 
                ? 'No has subido ninguna foto aún' 
                : 'No has marcado ninguna foto como "apareces en esta foto"'
              }
            </h3>
            <p>
              {vistaPerfil === 'mis-fotos' 
                ? 'Ve a "Subir foto" para agregar tu primera foto' 
                : 'Ve a la galería y marca las fotos donde apareces usando el botón con icono de usuario'
              }
            </p>
          </div>
        ) : (
          fotosActuales.map(foto => (
            <div 
              className={`perfil-ig-foto-gal ${fotosSeleccionadas.has(foto.id) ? 'seleccionada' : ''}`} 
              key={foto.id}
            >
              {modoSeleccion && (
                <div 
                  className="perfil-ig-seleccion-checkbox"
                  onClick={() => toggleSeleccion(foto.id)}
                >
                  {fotosSeleccionadas.has(foto.id) ? <FaCheckSquare /> : <FaSquare />}
                </div>
              )}
              <img src={UPLOADS_URL + '/' + foto.filename} alt={foto.title} loading="lazy" />
              <div className="perfil-ig-foto-overlay">
                <div className="perfil-ig-likes-overlay">
                  <FaHeart size={24} />
                  <span>{foto.votes || 0}</span>
                </div>
                {vistaPerfil === 'donde-aparezco' && (
                  <div className="perfil-ig-foto-owner">
                    <span>por @{foto.username}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token')||'');
  const [usuario, setUsuario] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [top, setTop] = useState([]);
  const [vista, setVista] = useState('galeria');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);
    } else {
      localStorage.removeItem('token');
      setUsuario(null);
    }
  }, [token]);

  const cargarFotos = useCallback(() => {
    Promise.all([
      axios.get(API + '/photos'),
      axios.get(API + '/photos/top')
    ]).then(([fotosRes, topRes]) => {
      setFotos(fotosRes.data);
      setTop(topRes.data);
    }).catch(err => {
      console.error('Error loading photos:', err);
    });
  }, []);

  useEffect(() => { cargarFotos(); }, [cargarFotos]);

  const votar = useCallback(async (id) => {
    if (!token) return;
    try {
      await axios.post(API + `/photos/${id}/vote`, {}, { headers: { Authorization: 'Bearer ' + token } });
      cargarFotos();
    } catch (err) {
      console.error('Error voting:', err);
    }
  }, [token, cargarFotos]);

  if (!token) return <Login setToken={setToken} />;

  return (
    <div className="app">
      <nav>
        <button onClick={()=>setVista('galeria')}><FaImages /> Galería</button>
        <button onClick={()=>setVista('perfil')}><FaUser /> Perfil</button>
        <button onClick={()=>setVista('subir')}><FaCamera /> Subir foto</button>
        <button onClick={()=>{setToken('')}}><FaSignOutAlt /> Salir</button>
      </nav>
      <div className="app-content">
        <Carrusel fotos={top} visibleVista={vista} />
        {vista === 'galeria' && <Galeria fotos={fotos} onVotar={votar} usuarioId={usuario?.id} />}
        {vista === 'perfil' && <Perfil token={token} />}
        {vista === 'subir' && <SubirFoto token={token} onSubida={cargarFotos} />}
      </div>
    </div>
  );
} 