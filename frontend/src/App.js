import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { FaCamera } from 'react-icons/fa';
import { FaImages, FaUser, FaSignOutAlt, FaHeart, FaDownload, FaCheckSquare, FaSquare, FaUserTag, FaCrown } from 'react-icons/fa';
import AdminPanel from './AdminPanel';

const API = process.env.REACT_APP_API_URL || 'https://galeria-actuaria-backend.onrender.com/api';
const UPLOADS_URL = process.env.REACT_APP_UPLOADS_URL || 'https://galeria-actuaria-backend.onrender.com/uploads';

const Carrusel = React.memo(({ fotos, visibleVista }) => {
  // Obtener solo las 3 fotos más votadas
  const top3Fotos = useMemo(() => fotos.slice(0, 3), [fotos]);

  console.log('🎯 Carrusel - fotos recibidas:', fotos);
  console.log('🎯 Carrusel - top3Fotos:', top3Fotos);
  console.log('🎯 Carrusel - visibleVista:', visibleVista);
  console.log('🎯 Carrusel - API URL:', API);

  if (top3Fotos.length < 1) {
    console.log('❌ Carrusel - No hay fotos para mostrar');
    return (
      <div className="top-fotos-section">
        <h2>🏆 Top 3 Fotos Más Votadas</h2>
        <p>No hay fotos disponibles</p>
      </div>
    );
  }

  console.log('✅ Carrusel - Renderizando con', top3Fotos.length, 'fotos');

  return (
    <div className="top-fotos-section">
      <h2>🏆 Top 3 Fotos Más Votadas</h2>
      <div className="top-fotos-grid">
        {top3Fotos.map((foto, index) => {
          console.log('🖼️ Renderizando foto:', foto);
          const imageUrl = foto.image_url || `${UPLOADS_URL}/${foto.filename}`;
          console.log('🖼️ URL de imagen:', imageUrl);
          
          return (
            <div key={foto.id} className="top-foto-card">
              <div className="top-foto-rank">#{index + 1}</div>
              <img 
                src={imageUrl} 
                alt={foto.title || 'Sin título'} 
                onError={(e) => console.error('❌ Error cargando imagen:', e.target.src)}
                onLoad={() => console.log('✅ Imagen cargada:', imageUrl)}
              />
              <div className="top-foto-info">
                <p>Por: {foto.username || 'Usuario desconocido'}</p>
                <div className="top-foto-stats">
                  <span className="votes">❤️ {foto.votes || 0} votos</span>
                  <span className="section">📁 {foto.section_name || 'Sin sección'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const Login = React.memo(({ setToken, setUser, setVista }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (isRegister) {
        // Registro
        const res = await axios.post(API + '/register', { username, email, password });
        setSuccess('¡Cuenta creada exitosamente! Iniciando sesión automáticamente...');
        
        // Después del registro exitoso, hacer login automático
        try {
          const loginRes = await axios.post(API + '/login', { username, password });
          console.log('✅ Login automático exitoso después del registro');
          
          // Establecer el nuevo token y usuario
          setToken(loginRes.data.token);
          if (loginRes.data.user) {
            setUser(loginRes.data.user);
          }
          
          // Asegurar que se vaya a la galería
          setTimeout(() => {
            setVista('galeria');
          }, 100);
          
        } catch (loginErr) {
          console.error('❌ Error en login automático:', loginErr);
          setError('Cuenta creada pero error al iniciar sesión automáticamente');
        }
        
        // Limpiar formulario
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        // Login
        console.log('🔐 Iniciando login para usuario:', username);
        const res = await axios.post(API + '/login', { username, password });
        console.log('✅ Login exitoso, respuesta:', res.data);
        console.log('🔑 Token recibido:', res.data.token ? 'Sí' : 'No');
        console.log('👤 User recibido:', res.data.user ? 'Sí' : 'No');
        
        setToken(res.data.token);
        if (res.data.user) {
          setUser(res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  }, [isRegister, setToken, username, email, password]);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>📸 Galería Actuarial</h1>
          <h2>
            {isRegister ? '✨ Crear cuenta' : '🚀 Iniciar sesión'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>👤 Usuario</label>
            <input 
              placeholder="Ingresa tu usuario" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              required 
            />
          </div>
          
          {isRegister && (
            <div className="input-group">
              <label>📧 Email</label>
              <input 
                type="email" 
                placeholder="Ingresa tu email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="input-group">
            <label>🔒 Contraseña</label>
            <input 
              type="password" 
              placeholder="Ingresa tu contraseña" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="submit-btn">
            {isRegister ? '✨ Registrarse' : '🚀 Entrar'}
          </button>
        </form>
        
        <div className="login-links">
          <button className="link-btn" onClick={()=>setIsRegister(r=>!r)}>
            {isRegister ? '🔙 ¿Ya tienes cuenta? Inicia sesión' : '✨ ¿No tienes cuenta? Regístrate'}
          </button>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}
        

      </div>
    </div>
  );
});

const Galeria = React.memo(({ fotos, onVotar, usuarioId, selectedSection, sections }) => {
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

  // Obtener nombre de la sección actual
  const currentSection = selectedSection ? sections.find(s => s.id == selectedSection) : null;

  return (
    <div className="galeria">
      <div className="galeria-header">
        <h2>
          {currentSection ? `📁 ${currentSection.name}` : '📸 Todas las fotos'}
        </h2>
        {currentSection && (
          <p className="galeria-description">{currentSection.description}</p>
        )}
        <div className="galeria-stats">
          <span className="fotos-count">{fotos.length} fotos</span>
        </div>
      </div>

      {fotos.length === 0 ? (
        <div className="galeria-empty">
          <h3>📸 No hay fotos en esta sección</h3>
          <p>
            {currentSection 
              ? `No se han subido fotos a "${currentSection.name}" aún`
              : 'No hay fotos en la galería'
            }
          </p>
        </div>
      ) : (
        <div className="galeria-grid">
          {fotos.map(foto => (
            <div className="foto" key={foto.id}>
              <img src={foto.image_url || UPLOADS_URL + '/' + foto.filename} alt={foto.title} loading="lazy" />
              <div className="foto-info">
                <b>{foto.title}</b>
                <span>por {foto.username}</span>
                <span className="foto-seccion">📁 {foto.section_name || 'Sin sección'}</span>
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
      )}
    </div>
  );
});

const SubirFoto = React.memo(({ onSubida, token }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Obtener secciones disponibles
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(API + '/sections');
        setSections(response.data);
        if (response.data.length > 0) {
          setSelectedSection(response.data[0].id);
        }
      } catch (err) {
        console.error('Error obteniendo secciones:', err);
      }
    };
    fetchSections();
  }, []);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (files.length === 0) return setError('Selecciona al menos una foto');
    if (!selectedSection) return setError('Selecciona una sección');
    
    setUploading(true);
    
    const form = new FormData();
    // Agregar múltiples archivos
    files.forEach((file, index) => {
      form.append('photos', file);
    });
    form.append('section_id', selectedSection);
    
    try {
      const response = await axios.post(API + '/photos', form, { 
        headers: { Authorization: 'Bearer ' + token } 
      });
      
      setFiles([]); 
      setSuccess(response.data.message || '¡Fotos subidas exitosamente! 📸');
      onSubida();
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir las fotos');
    } finally {
      setUploading(false);
    }
  }, [files, selectedSection, token, onSubida]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="subir-foto">
      <h2>📸 Subir Fotos</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="section">Selecciona una sección:</label>
          <select 
            id="section"
            value={selectedSection} 
            onChange={e => setSelectedSection(e.target.value)} 
            required
            disabled={uploading}
          >
            <option value="">Selecciona una sección</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="photos">Selecciona las fotos (máximo 10):</label>
          <input 
            id="photos"
            type="file" 
            accept="image/*" 
            multiple
            onChange={handleFileChange} 
            required 
            disabled={uploading}
            ref={fileInputRef}
          />
          <small>Puedes seleccionar múltiples fotos a la vez</small>
        </div>

        {/* Vista previa de archivos seleccionados */}
        {files.length > 0 && (
          <div className="files-preview">
            <h4>Archivos seleccionados ({files.length}):</h4>
            <div className="files-grid">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${file.name}`}
                    className="file-preview"
                  />
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                    disabled={uploading}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={uploading || files.length === 0 || !selectedSection}
          className="submit-btn"
        >
          {uploading ? '⏳ Subiendo...' : `📤 Subir ${files.length} foto${files.length !== 1 ? 's' : ''}`}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
});

const GestionarSecciones = React.memo(() => {
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingSection, setDeletingSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Obtener secciones existentes
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(API + '/sections');
        setSections(response.data);
      } catch (err) {
        console.error('Error obteniendo secciones:', err);
      }
    };
    fetchSections();
  }, []);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSectionName.trim() || !password.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      await axios.post(API + '/sections', {
        name: newSectionName.trim(),
        description: newSectionDescription.trim(),
        password: password
      });

      setSuccess('¡Sección creada exitosamente! 🎉');
      setNewSectionName('');
      setNewSectionDescription('');
      setPassword('');

      // Recargar secciones
      const response = await axios.get(API + '/sections');
      setSections(response.data);

      // Recargar la página después de 1 segundo para mostrar los cambios
      setTimeout(() => {
        sessionStorage.setItem('redirectToSecciones', 'true');
        window.location.reload();
      }, 1000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al crear la sección');
      }
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editName.trim() || !editPassword.trim()) {
      setError('Nombre y contraseña son requeridos');
      return;
    }

    try {
      await axios.put(API + `/sections/${editingSection.id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        password: editPassword
      });

      setSuccess('¡Sección editada exitosamente! ✏️');
      setEditingSection(null);
      setEditName('');
      setEditDescription('');
      setEditPassword('');

      // Recargar secciones
      const response = await axios.get(API + '/sections');
      setSections(response.data);

      // Recargar la página después de 1 segundo para mostrar los cambios
      setTimeout(() => {
        sessionStorage.setItem('redirectToSecciones', 'true');
        window.location.reload();
      }, 1000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al editar la sección');
      }
    }
  };

  const startEditing = (section) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditDescription(section.description || '');
    setEditPassword('');
    setError('');
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditName('');
    setEditDescription('');
    setEditPassword('');
    setError('');
  };

  const handleDeleteSection = async (sectionId, sectionName) => {
    if (!deletePassword.trim()) {
      setError('Contraseña requerida para eliminar');
      return;
    }

    try {
      await axios.delete(API + `/sections/${sectionId}`, {
        data: { password: deletePassword }
      });

      setSuccess(`¡Sección "${sectionName}" eliminada exitosamente! 🗑️`);
      setDeletePassword('');
      setDeletingSection(null);

      // Recargar secciones
      const response = await axios.get(API + '/sections');
      setSections(response.data);

      // Recargar la página después de 1 segundo para mostrar los cambios
      setTimeout(() => {
        sessionStorage.setItem('redirectToSecciones', 'true');
        window.location.reload();
      }, 1000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al eliminar la sección');
      }
    }
  };

  return (
    <div className="gestionar-secciones">
      <h2>📁 Gestionar Secciones</h2>
      
      <div className="secciones-existente">
        <h3>Secciones existentes:</h3>
        <div className="secciones-grid">
          {sections.map(section => (
            <div key={section.id} className="seccion-card">
              <h4>{section.name}</h4>
              <p>{section.description || 'Sin descripción'}</p>
              <small>Creada: {new Date(section.created_at).toLocaleDateString()}</small>
              <div className="seccion-actions">
                <button 
                  className="editar-seccion-btn"
                  onClick={() => startEditing(section)}
                  title="Editar sección"
                >
                  ✏️ Editar
                </button>
                <button 
                  className="eliminar-seccion-btn"
                  onClick={() => setDeletingSection(section)}
                  title="Eliminar sección"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal para eliminar sección */}
        {deletingSection && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>🗑️ Eliminar Sección</h3>
              <p>¿Estás seguro de que quieres eliminar la sección <strong>"{deletingSection.name}"</strong>?</p>
              <p className="warning">⚠️ Esta acción no se puede deshacer</p>
              
              <input
                type="password"
                placeholder="Contraseña de administrador"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="password-input"
              />
              
              <div className="modal-actions">
                <button 
                  onClick={() => handleDeleteSection(deletingSection.id, deletingSection.name)}
                  className="eliminar-btn"
                >
                  🗑️ Eliminar
                </button>
                <button 
                  onClick={() => {
                    setDeletingSection(null);
                    setDeletePassword('');
                  }}
                  className="cancelar-btn"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar sección */}
        {editingSection && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>✏️ Editar Sección</h3>
              <form onSubmit={handleEditSection}>
                <div className="form-group">
                  <label htmlFor="edit-name">Nombre de la sección:</label>
                  <input
                    id="edit-name"
                    type="text"
                    placeholder="Nombre de la sección"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-description">Descripción:</label>
                  <textarea
                    id="edit-description"
                    placeholder="Descripción (opcional)"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-password">Contraseña de administrador:</label>
                  <input
                    id="edit-password"
                    type="password"
                    placeholder="Contraseña de administrador"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="guardar-btn">
                    💾 Guardar Cambios
                  </button>
                  <button 
                    type="button"
                    onClick={cancelEditing}
                    className="cancelar-btn"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="crear-seccion">
        <h3>Crear nueva sección:</h3>
        <form onSubmit={handleCreateSection}>
          <input
            type="text"
            placeholder="Nombre de la sección"
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            required
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={newSectionDescription}
            onChange={e => setNewSectionDescription(e.target.value)}
            rows="3"
          />
          <input
            type="password"
            placeholder="Contraseña de administrador"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Crear sección</button>
        </form>
        

        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
});

const Perfil = React.memo(({ token, setVista }) => {
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
  const [deletingPhoto, setDeletingPhoto] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      const fetchUserData = async () => {
        try {
          const [fotosRes, statsRes, fotosMarcadasRes, profilePicRes] = await Promise.all([
            axios.get(API + '/user/photos', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(API + '/user/stats', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(API + '/user/tagged-photos', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(API + '/user/profile-picture', { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setFotos(fotosRes.data);
          setStats(statsRes.data);
          setFotosMarcadas(fotosMarcadasRes.data);
          
          // Establecer foto de perfil desde el servidor
          if (profilePicRes.data.profile_picture) {
            setFotoPerfil(profilePicRes.data.profile_picture);
          }
        } catch (err) {
          console.error('Error obteniendo datos del usuario:', err);
        }
      };
      
      // Obtener información del usuario del token
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);
      
      fetchUserData();
    }
  }, [token]);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      // Subir la foto al servidor
      const response = await axios.post(API + '/user/profile-picture', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Actualizar el estado con el nombre del archivo del servidor
      setFotoPerfil(response.data.filename);
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      console.error('Error subiendo foto de perfil:', err);
      alert('Error al subir la foto de perfil. Inténtalo de nuevo.');
    }
  }, [token]);

  const fotoPerfilSrc = useMemo(() => {
    if (fotoPerfil) {
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
      
      console.log('📸 Iniciando descarga de', fotosParaDescargar.length, 'fotos...');
      
      // Descargar cada imagen y agregarla al ZIP
      for (const foto of fotosParaDescargar) {
        try {
          console.log('📥 Descargando foto:', foto.filename);
          const response = await fetch(UPLOADS_URL + '/' + foto.filename);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Determinar la extensión del archivo basándose en el tipo MIME
          let extension = 'jpg'; // por defecto
          if (blob.type) {
            if (blob.type.includes('png')) extension = 'png';
            else if (blob.type.includes('gif')) extension = 'gif';
            else if (blob.type.includes('webp')) extension = 'webp';
            else if (blob.type.includes('jpeg')) extension = 'jpg';
          }
          
          // Crear un nombre de archivo válido
          const nombreArchivo = foto.title && foto.title.trim() !== '' 
            ? `${foto.title}.${extension}`
            : `foto_${foto.id}.${extension}`;
          
          console.log('💾 Agregando al ZIP:', nombreArchivo);
          zip.file(nombreArchivo, blob);
          
        } catch (err) {
          console.error(`❌ Error descargando ${foto.filename}:`, err);
          // Continuar con las otras fotos en lugar de fallar completamente
        }
      }

      console.log('🗜️ Generando archivo ZIP...');
      // Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('📦 ZIP generado, tamaño:', zipBlob.size, 'bytes');
      
      // Crear y descargar el archivo
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fotos_${usuario.username}_${vistaPerfil}_${new Date().toISOString().split('T')[0]}.zip`;
      a.style.display = 'none';
      
      console.log('🔗 Creando enlace de descarga...');
      document.body.appendChild(a);
      
      // Forzar la descarga
      console.log('⬇️ Iniciando descarga...');
      a.click();
      
      // Limpiar después de un breve delay
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('🧹 Enlace de descarga limpiado');
      }, 1000);

      // Fallback: mostrar enlace manual inmediatamente
      console.log('🔗 Mostrando enlace manual para descarga...');
      const fallbackUrl = URL.createObjectURL(zipBlob);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fallbackUrl;
      fallbackLink.download = `fotos_${usuario.username}_${vistaPerfil}_${new Date().toISOString().split('T')[0]}.zip`;
      fallbackLink.textContent = `📥 DESCARGAR ZIP (${fotosParaDescargar.length} fotos) - Haz clic aquí`;
      fallbackLink.style.cssText = 'display: block; padding: 15px; background: #28a745; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0; text-align: center; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);';
      
      // Insertar el enlace en la página de manera más visible
      const container = document.querySelector('.perfil-ig-seleccion-controls');
      if (container) {
        // Crear un contenedor destacado para el enlace
        const downloadContainer = document.createElement('div');
        downloadContainer.style.cssText = 'background: #f8f9fa; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;';
        
        const downloadTitle = document.createElement('h4');
        downloadTitle.textContent = '📦 Archivo ZIP listo para descargar';
        downloadTitle.style.cssText = 'margin: 0 0 15px 0; color: #28a745; font-size: 18px;';
        
        const downloadInfo = document.createElement('p');
        downloadInfo.textContent = `Se generó un archivo ZIP con ${fotosParaDescargar.length} foto(s). Haz clic en el botón de abajo para descargarlo.`;
        downloadInfo.style.cssText = 'margin: 0 0 15px 0; color: #666;';
        
        downloadContainer.appendChild(downloadTitle);
        downloadContainer.appendChild(downloadInfo);
        downloadContainer.appendChild(fallbackLink);
        container.appendChild(downloadContainer);
        
        // Limpiar después de 5 minutos
        setTimeout(() => {
          if (downloadContainer.parentNode) {
            downloadContainer.parentNode.removeChild(downloadContainer);
            URL.revokeObjectURL(fallbackUrl);
            console.log('🧹 Enlace de descarga manual limpiado');
          }
        }, 300000);
      }

      console.log('✅ Descarga completada exitosamente');

      // Salir del modo selección
      salirModoSeleccion();
    } catch (err) {
      console.error('❌ Error creando ZIP:', err);
      alert('Error al crear el archivo ZIP. Intenta de nuevo.');
    }
  }, [fotosSeleccionadas, fotos, fotosMarcadas, usuario.username, vistaPerfil, salirModoSeleccion]);

  const fotosActuales = vistaPerfil === 'mis-fotos' ? fotos : fotosMarcadas;

  // Función para quitar foto marcada
  const quitarFotoMarcada = async (photoId) => {
    try {
      console.log('❌ Quitando foto marcada con ID:', photoId);
      
      // Llamar a la API para desmarcar la foto
      const response = await axios.post(API + `/photos/${photoId}/tag`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('✅ Respuesta de la API:', response.data);
      
      if (!response.data.tagged) {
        // La foto fue desmarcada exitosamente
        console.log('✅ Foto desmarcada exitosamente');
        
        // Actualizar el estado local
        setFotosMarcadas(prev => prev.filter(foto => foto.id !== photoId));
        
        // Mostrar mensaje de éxito
        setSuccess('Foto quitada de "Donde aparezco" exitosamente');
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.log('⚠️ La foto sigue marcada');
        setError('No se pudo quitar la foto');
      }
      
    } catch (err) {
      console.error('❌ Error al quitar foto marcada:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al quitar la foto');
      }
    }
  };

  // Función para eliminar foto
  const handleDeletePhoto = async (photoId, photoName) => {
    console.log('🗑️ Iniciando eliminación de foto:', { photoId, photoName });
    console.log('🔑 Token disponible:', !!token);
    console.log('✍️ Confirmación escrita:', deleteConfirm);
    
    if (!deleteConfirm.trim()) {
      setError('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    if (deleteConfirm !== 'ELIMINAR') {
      setError('Debes escribir exactamente "ELIMINAR" para confirmar');
      return;
    }

    try {
      console.log('🌐 Enviando petición DELETE a:', API + `/photos/${photoId}`);
      const response = await axios.delete(API + `/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Respuesta del servidor:', response.data);

      setSuccess('¡Foto eliminada exitosamente! 🗑️');
      setDeletingPhoto(null);
      setDeleteConfirm('');

      // Recargar fotos del usuario
      console.log('🔄 Recargando fotos del usuario...');
      const fotosRes = await axios.get(API + '/user/photos', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setFotos(fotosRes.data);
      console.log('✅ Fotos recargadas:', fotosRes.data);

      // También recargar estadísticas del usuario
      try {
        const statsRes = await axios.get(API + '/user/stats', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setStats(statsRes.data);
        console.log('✅ Estadísticas actualizadas:', statsRes.data);
      } catch (err) {
        console.error('⚠️ Error actualizando estadísticas:', err);
      }

      // Recargar también las fotos marcadas para mantener sincronizados los contadores
      try {
        const fotosMarcadasRes = await axios.get(API + '/user/tagged-photos', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setFotosMarcadas(fotosMarcadasRes.data);
        console.log('✅ Fotos marcadas recargadas:', fotosMarcadasRes.data);
      } catch (err) {
        console.log('⚠️ No se pudieron recargar las fotos marcadas:', err);
      }

      // Establecer la vista al perfil y guardar bandera para recarga
      console.log('🔄 Estableciendo vista al perfil después de eliminar foto...');
      setVista('perfil');
      
      // Guardar que estamos en el perfil antes de recargar
      sessionStorage.setItem('redirectToPerfil', 'true');
      console.log('💾 Bandera de redirección al perfil guardada en sessionStorage');
      
      // Recargar la página después de 1 segundo para mostrar los cambios
      setTimeout(() => {
        console.log('🔄 Recargando página para mostrar cambios...');
        console.log('🔍 Verificando bandera antes de recargar:', sessionStorage.getItem('redirectToPerfil'));
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('❌ Error al eliminar foto:', err);
      console.error('❌ Detalles del error:', err.response?.data);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al eliminar la foto');
      }
    }
  };

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
          onClick={() => {
            setVistaPerfil('mis-fotos');
            setModoSeleccion(false);
            setFotosSeleccionadas(new Set());
          }}
        >
          Mis fotos ({fotos.length})
        </button>
        <button 
          className={`perfil-ig-tab ${vistaPerfil === 'donde-aparezco' ? 'activo' : ''}`}
          onClick={() => {
            setVistaPerfil('donde-aparezco');
            setModoSeleccion(false);
            setFotosSeleccionadas(new Set());
          }}
        >
          Donde aparezco ({fotosMarcadas.length})
        </button>
        {!modoSeleccion && vistaPerfil === 'donde-aparezco' && (
          <button 
            className="perfil-ig-descargar-btn" 
            onClick={() => setModoSeleccion(true)}
            title="Descargar múltiples fotos"
          >
            <FaDownload /> Descargar fotos
          </button>
        )}
      </div>

      {modoSeleccion && vistaPerfil === 'donde-aparezco' && (
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
              {modoSeleccion && vistaPerfil === 'donde-aparezco' && (
                <div 
                  className="perfil-ig-seleccion-checkbox"
                  onClick={() => toggleSeleccion(foto.id)}
                >
                  {fotosSeleccionadas.has(foto.id) ? <FaCheckSquare /> : <FaSquare />}
                </div>
              )}
              <img src={foto.image_url || UPLOADS_URL + '/' + foto.filename} alt={foto.title} loading="lazy" />
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
              
              {/* Botón de eliminar solo en "Mis fotos" */}
              {/* Botón de eliminar solo en "Mis fotos" */}
              {vistaPerfil === 'mis-fotos' && (
                <button 
                  className="eliminar-foto-btn-overlay"
                  onClick={() => {
                    console.log('🗑️ Botón eliminar clickeado para foto:', foto);
                    console.log('📸 Datos de la foto:', foto);
                    setDeletingPhoto(foto);
                  }}
                  title="Eliminar esta foto"
                >
                  🗑️
                </button>
              )}
              
              {/* Botón de quitar solo en "Donde aparezco" */}
              {vistaPerfil === 'donde-aparezco' && (
                <button 
                  className="quitar-foto-btn-overlay"
                  onClick={() => {
                    console.log('❌ Botón quitar clickeado para foto:', foto);
                    quitarFotoMarcada(foto.id);
                  }}
                  title="Quitar esta foto de 'Donde aparezco'"
                >
                  ❌
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mensajes de estado */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Modal para eliminar foto */}
      {deletingPhoto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🗑️ Eliminar Foto</h3>
            <p>¿Estás seguro de que quieres eliminar esta foto?</p>
            <p className="warning">⚠️ Esta acción no se puede deshacer</p>
            
            <div className="form-group">
              <label htmlFor="delete-confirm">Escribe "ELIMINAR" para confirmar:</label>
              <input
                id="delete-confirm"
                type="text"
                placeholder="Escribe ELIMINAR"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="password-input"
              />
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => handleDeletePhoto(deletingPhoto.id, deletingPhoto.title)}
                className="eliminar-btn"
                disabled={deleteConfirm !== 'ELIMINAR'}
              >
                🗑️ Eliminar
              </button>
              <button 
                onClick={() => {
                  setDeletingPhoto(null);
                  setDeleteConfirm('');
                }}
                className="cancelar-btn"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token')||'');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [usuario, setUsuario] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [top, setTop] = useState([]);
  const [sections, setSections] = useState([]);
  const [vista, setVista] = useState('galeria');
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingSection, setLoadingSection] = useState(false);
  const [sectionCounts, setSectionCounts] = useState({}); // Conteo de fotos por sección
  
  // Función para limpiar completamente el estado de la aplicación
  const clearAppState = useCallback(() => {
    setFotos([]);
    setTop([]);
    setSelectedSection(null);
    setError('');
    setLoadingSection(false);
    setSectionCounts({});
    setVista('galeria');
    // No establecer setLoading(true) aquí para evitar conflictos
  }, []);

  useEffect(() => {
    console.log('🔑 useEffect token/user - token:', token ? 'Sí' : 'No', 'user:', user ? 'Sí' : 'No');
    
    if (token) {
      console.log('💾 Guardando token en localStorage...');
      localStorage.setItem('token', token);
      console.log('✅ Token guardado en localStorage');
      
      if (user) {
        console.log('💾 Guardando user en localStorage...');
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User guardado en localStorage');
      }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Payload del token:', payload);
        setUsuario(payload);
        
        // Solo establecer galería si no hay redirecciones pendientes y no estamos ya en otra vista
        const hasRedirects = sessionStorage.getItem('redirectToPerfil') || 
                           sessionStorage.getItem('redirectToSecciones') || 
                           sessionStorage.getItem('redirectToAdminPhotos');
        
        if (!hasRedirects && vista !== 'perfil' && vista !== 'secciones' && vista !== 'admin') {
          console.log('🔄 No hay redirecciones pendientes, estableciendo vista a galería...');
          setVista('galeria');
        } else if (hasRedirects) {
          console.log('🔄 Hay redirecciones pendientes, esperando a que se procesen...');
        }
        
      } catch (err) {
        console.error('❌ Error decodificando token:', err);
      }
    } else {
      console.log('🗑️ Limpiando localStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUsuario(null);
      setUser(null);
      
      // Al cerrar sesión, también limpiar la vista
      setVista('galeria');
    }
  }, [token, user]);

  // useEffect para manejar redirecciones al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect de redirecciones ejecutándose al montar...');
    
    // Verificar redirecciones pendientes al montar el componente
    const redirectToPerfil = sessionStorage.getItem('redirectToPerfil');
    const redirectToSecciones = sessionStorage.getItem('redirectToSecciones');
    const redirectToAdminPhotos = sessionStorage.getItem('redirectToAdminPhotos');
    
    if (redirectToPerfil === 'true') {
      console.log('🔄 Redirección al perfil detectada al montar, estableciendo vista...');
      setVista('perfil');
      sessionStorage.removeItem('redirectToPerfil');
      return; // Salir temprano para evitar que se ejecute el resto
    } else if (redirectToSecciones === 'true') {
      console.log('🔄 Redirección a secciones detectada al montar, estableciendo vista...');
      setVista('secciones');
      sessionStorage.removeItem('redirectToSecciones');
      return; // Salir temprano para evitar que se ejecute el resto
    } else if (redirectToAdminPhotos === 'true') {
      console.log('🔄 Redirección al admin detectada al montar, estableciendo vista...');
      setVista('admin');
      sessionStorage.removeItem('redirectToAdminPhotos');
      return; // Salir temprano para evitar que se ejecute el resto
    }
  }, []); // Solo se ejecuta una vez al montar

  // useEffect para verificar redirecciones después de que se establezca la vista
  useEffect(() => {
    if (vista === 'galeria') {
      // Si estamos en galería, verificar si deberíamos estar en otra vista
      const redirectToPerfil = sessionStorage.getItem('redirectToPerfil');
      const redirectToSecciones = sessionStorage.getItem('redirectToSecciones');
      const redirectToAdminPhotos = sessionStorage.getItem('redirectToAdminPhotos');
      
      if (redirectToPerfil === 'true') {
        console.log('🔄 Redirección al perfil detectada después de establecer vista, cambiando...');
        setVista('perfil');
        sessionStorage.removeItem('redirectToPerfil');
      } else if (redirectToSecciones === 'true') {
        console.log('🔄 Redirección a secciones detectada después de establecer vista, cambiando...');
        setVista('secciones');
        sessionStorage.removeItem('redirectToSecciones');
      } else if (redirectToAdminPhotos === 'true') {
        console.log('🔄 Redirección al admin detectada después de establecer vista, cambiando...');
        setVista('admin');
        sessionStorage.removeItem('redirectToAdminPhotos');
      }
    }
  }, [vista]); // Se ejecuta cuando cambie la vista

  // useEffect para cargar datos cuando se establece el token
  useEffect(() => {
    if (token && user) {
      console.log('🔄 Token y usuario establecidos, cargando datos...');
      // Forzar la recarga de datos
      setLoading(true);
      // El useEffect de fetchSections se ejecutará automáticamente
    }
  }, [token, user]);



  // Cargar secciones y fotos al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect iniciado - cargando datos...');
    const fetchSections = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('📋 Obteniendo secciones...');
        const response = await axios.get(API + '/sections');
        console.log('✅ Secciones obtenidas:', response.data);
        setSections(response.data);
        
        // Al inicio solo cargar las fotos más ranqueadas, NO todas las fotos
        console.log('🏆 Obteniendo fotos top...');
        const topResponse = await axios.get(API + '/photos/top');
        console.log('✅ Top fotos cargadas:', topResponse.data);
        setTop(topResponse.data);
        
        // Al inicio solo cargar las fotos top, NO todas las fotos
        console.log('📸 No se cargan todas las fotos al inicio - esperando selección del usuario');
        setFotos([]); // No mostrar fotos individuales al inicio
        setSelectedSection(null); // No hay sección seleccionada al inicio
        
        // Cargar el conteo de fotos por sección
        console.log('📊 Obteniendo conteo de fotos por sección...');
        const allPhotosResponse = await axios.get(API + '/photos');
        const allPhotos = allPhotosResponse.data;
        
        // Calcular conteo por sección
        const counts = {};
        response.data.forEach(section => {
          counts[section.id] = allPhotos.filter(photo => photo.section_id === section.id).length;
        });
        
        // Agregar conteo total
        counts['all'] = allPhotos.length;
        
        console.log('✅ Conteo por sección:', counts);
        setSectionCounts(counts);
        
        setLoading(false);
        console.log('✅ Estado actualizado - top:', topResponse.data, 'fotos:', [], 'selectedSection:', null, 'counts:', counts);
      } catch (err) {
        console.error('❌ Error obteniendo datos:', err);
        setError('Error al cargar los datos iniciales');
        setLoading(false);
      }
    };
    
    fetchSections();
  }, [token, user]); // Ejecutar cuando cambie el token o usuario

  // Función cargarFotos eliminada - ya no se usa

  const handleShowAllPhotos = useCallback(async () => {
    if (loadingSection) return; // Evitar clics múltiples
    
    console.log('🔄 Cargando todas las fotos...');
    setLoadingSection(true);
    setSelectedSection('all');
    
    try {
      // Cargar todas las fotos sin filtrar por sección
      const fotosRes = await axios.get(API + '/photos');
      console.log('✅ Todas las fotos cargadas:', fotosRes.data);
      setFotos(fotosRes.data);
      
      // También actualizar el top con las fotos más votadas
      const topRes = await axios.get(API + '/photos/top');
      console.log('✅ Top fotos actualizado:', topRes.data);
      setTop(topRes.data);
      
      // Actualizar conteo por sección
      const allPhotos = fotosRes.data;
      const counts = {};
      sections.forEach(section => {
        counts[section.id] = allPhotos.filter(photo => photo.section_id === section.id).length;
      });
      counts['all'] = allPhotos.length;
      setSectionCounts(counts);
    } catch (err) {
      console.error('❌ Error loading all photos:', err);
    } finally {
      setLoadingSection(false);
    }
  }, [loadingSection, sections]);

  const handleSectionClick = useCallback(async (sectionId) => {
    if (loadingSection) return; // Evitar clics múltiples
    
    console.log('🔄 Cargando fotos de sección:', sectionId);
    setLoadingSection(true);
    setSelectedSection(sectionId);
    
    try {
      // Cargar fotos de la sección seleccionada
      const fotosRes = await axios.get(`${API}/photos?section_id=${sectionId}`);
      console.log('✅ Fotos de sección cargadas:', fotosRes.data);
      setFotos(fotosRes.data);
      
      // También actualizar el top con las fotos más votadas
      const topRes = await axios.get(API + '/photos/top');
      console.log('✅ Top fotos actualizado:', topRes.data);
      setTop(topRes.data);
      
      // Actualizar conteo por sección
      const allPhotosResponse = await axios.get(API + '/photos');
      const allPhotos = allPhotosResponse.data;
      const counts = {};
      sections.forEach(section => {
        counts[section.id] = allPhotos.filter(photo => photo.section_id === section.id).length;
      });
      counts['all'] = allPhotos.length;
      setSectionCounts(counts);
    } catch (err) {
      console.error('❌ Error loading section photos:', err);
    } finally {
      setLoadingSection(false);
    }
  }, [loadingSection, sections]);

  const votar = useCallback(async (id) => {
    if (!token) return;
    try {
      await axios.post(API + '/photos/' + id + '/vote', {}, { headers: { Authorization: 'Bearer ' + token } });
      
      // Recargar fotos de la sección actual y actualizar conteos
      try {
        const allPhotosResponse = await axios.get(API + '/photos');
        const allPhotos = allPhotosResponse.data;
        
        // Actualizar conteo por sección
        const counts = {};
        sections.forEach(section => {
          counts[section.id] = allPhotos.filter(photo => photo.section_id === section.id).length;
        });
        counts['all'] = allPhotos.length;
        setSectionCounts(counts);
        
        // Recargar fotos de la sección actual
        if (selectedSection === 'all') {
          handleShowAllPhotos();
        } else if (selectedSection) {
          handleSectionClick(selectedSection);
        }
        
        // También recargar las fotos top
        const topResponse = await axios.get(API + '/photos/top');
        setTop(topResponse.data);
      } catch (err) {
        console.error('Error actualizando conteos después de votar:', err);
      }
    } catch (err) {
      console.error('Error votando:', err);
    }
  }, [token, sections, selectedSection, handleShowAllPhotos, handleSectionClick]);

  return (
    <div className="app">
      {!token ? (
        <Login setToken={setToken} setUser={setUser} setVista={setVista} />
      ) : (
        <>
          <nav>
            <button onClick={()=>setVista('galeria')}><FaImages /> Galería</button>
            <button onClick={()=>setVista('perfil')}><FaUser /> Perfil</button>
            <button onClick={()=>setVista('subir')}><FaCamera /> Subir foto</button>
            {user && user.role === 'admin' && (
              <>
                <button onClick={()=>setVista('secciones')}>📁 Secciones</button>
                <button onClick={()=>setVista('admin')}><FaCrown /> Admin</button>
              </>
            )}
            <button onClick={()=>{
              setToken(''); 
              setUser(null);
              clearAppState();
            }}><FaSignOutAlt /> Salir</button>
          </nav>
          
          <div className="app-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando galería...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">❌ {error}</p>
                <button onClick={() => window.location.reload()}>Reintentar</button>
              </div>
            ) : (
              <>
                {vista === 'galeria' && (
                  <>
                    <div className="secciones-navegacion">
                      <div className="secciones-grid-nav">
                        <button 
                          className={`seccion-nav-btn ${selectedSection === 'all' ? 'activa' : ''}`}
                          onClick={handleShowAllPhotos}
                          disabled={loadingSection}
                        >
                          <span className="seccion-icon">
                            {loadingSection && selectedSection === 'all' ? '⏳' : '📸'}
                          </span>
                          <span className="seccion-nombre">
                            {loadingSection && selectedSection === 'all' ? 'Cargando...' : 'Todas las fotos'}
                          </span>
                          <span className="seccion-count">({sectionCounts['all'] || 0} fotos)</span>
                        </button>
                        {sections.map(section => {
                          const isSelected = selectedSection === section.id;
                          const isLoading = loadingSection && isSelected;
                          
                          return (
                            <button 
                              key={section.id} 
                              className={`seccion-nav-btn ${isSelected ? 'activa' : ''}`}
                              onClick={() => handleSectionClick(section.id)}
                              disabled={loadingSection}
                            >
                              <span className="seccion-icon">
                                {isLoading ? '⏳' : '📁'}
                              </span>
                              <span className="seccion-nombre">
                                {isLoading ? 'Cargando...' : section.name}
                              </span>
                              <span className="seccion-count">
                                ({sectionCounts[section.id] || 0} fotos)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* El Carrusel solo se muestra en galería */}
                    <Carrusel fotos={top} visibleVista={vista} />
                    
                    {console.log('🎯 Render principal - top:', top)}
                    {console.log('🎯 Render principal - vista:', vista)}
                    {console.log('🎯 Render principal - fotos:', fotos)}
                    {console.log('🎯 Render principal - API:', API)}
                    {top.length > 0 && console.log('🎯 Primera foto top:', top[0])}
                    
                    {/* Mostrar Galeria cuando hay una sección seleccionada o cuando se muestran todas las fotos */}
                    {(selectedSection && selectedSection !== 'all') && (
                      <Galeria 
                        fotos={fotos} 
                        onVotar={votar} 
                        usuarioId={usuario?.id} 
                        selectedSection={selectedSection} 
                        sections={sections} 
                      />
                    )}
                    
                    {/* Mostrar todas las fotos cuando selectedSection es 'all' */}
                    {selectedSection === 'all' && (
                      <Galeria 
                        fotos={fotos} 
                        onVotar={votar} 
                        usuarioId={usuario?.id} 
                        selectedSection={null} 
                        sections={sections} 
                      />
                    )}
                    
                    {/* Mensaje cuando no hay sección seleccionada */}
                    {!selectedSection && (
                      <div className="seleccionar-seccion-mensaje">
                        <h3>🎯 ¡Bienvenido a la Galería Actuarial!</h3>
                        <p>Selecciona una sección específica para ver las fotos, o haz clic en "Todas las fotos" para explorar toda la galería.</p>
                        <div className="seccion-sugerencias">
                          <p>💡 <strong>Sugerencias:</strong></p>
                          <ul>
                            <li>Haz clic en "Todas las fotos" para ver todo el contenido</li>
                            <li>Explora secciones específicas para fotos organizadas por tema</li>
                            <li>¡No olvides votar por tus fotos favoritas!</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {vista === 'perfil' && <Perfil token={token} setVista={setVista} />}
                {vista === 'subir' && <SubirFoto token={token} onSubida={async () => {
                   // Recargar fotos de la sección actual y actualizar conteos
                   try {
                     const allPhotosResponse = await axios.get(API + '/photos');
                     const allPhotos = allPhotosResponse.data;
                     
                     // Actualizar conteo por sección
                     const counts = {};
                     sections.forEach(section => {
                       counts[section.id] = allPhotos.filter(photo => photo.section_id === section.id).length;
                     });
                     counts['all'] = allPhotos.length;
                     setSectionCounts(counts);
                     
                     // Recargar fotos de la sección actual
                     if (selectedSection === 'all') {
                       handleShowAllPhotos();
                     } else if (selectedSection) {
                       handleSectionClick(selectedSection);
                     }
                     
                     // También recargar las fotos top
                     const topResponse = await axios.get(API + '/photos/top');
                     setTop(topResponse.data);
                   } catch (err) {
                     console.error('Error actualizando conteos:', err);
                   }
                 }} />}
                {vista === 'secciones' && <GestionarSecciones />}
                {vista === 'admin' && user && user.role === 'admin' && (
                  <AdminPanel 
                    user={user} 
                    onLogout={() => {
                      setToken('');
                      setUser(null);
                    }} 
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
} 