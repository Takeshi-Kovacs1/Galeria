import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

  // Obtener token del localStorage
  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔍 Buscando token en localStorage:', token ? 'Encontrado' : 'No encontrado');
    return token;
  };

  // Función para hacer peticiones a la API
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    console.log('🔑 Token obtenido:', token ? 'Sí' : 'No');
    console.log('🌐 Haciendo petición a:', `http://localhost:4001${endpoint}`);
    
    const response = await fetch(`http://localhost:4001${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    console.log('📡 Respuesta recibida:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  };

  // Cargar dashboard
  const loadDashboard = async () => {
    try {
      console.log('📊 Cargando dashboard...');
      setLoading(true);
      const data = await apiCall('/api/admin/dashboard');
      console.log('✅ Dashboard cargado:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      setMessage(`Error cargando dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/users');
      setUsers(data);
    } catch (error) {
      setMessage(`Error cargando usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar fotos
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/photos');
      setPhotos(data);
    } catch (error) {
      setMessage(`Error cargando fotos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar logs
  const loadLogs = async () => {
    try {
      console.log('📝 Cargando logs...');
      setLoading(true);
      const data = await apiCall('/api/admin/logs');
      console.log('✅ Logs cargados:', data);
      setLogs(data);
    } catch (error) {
      console.error('❌ Error cargando logs:', error);
      setMessage(`Error cargando logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Borrar todos los logs
  const clearAllLogs = async () => {
    try {
      console.log('🗑️ Iniciando limpieza de todos los logs...');
      setLoading(true);
      
      const response = await apiCall('/api/admin/logs/clear', {
        method: 'DELETE'
      });
      
      console.log('✅ Respuesta de limpieza de logs:', response);
      setMessage('Todos los logs han sido borrados exitosamente');
      
      // Recargar logs después de un pequeño delay para asegurar que se procese
      setTimeout(() => {
        console.log('🔄 Recargando logs después de limpieza...');
        loadLogs();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error limpiando logs:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  // Banear/desbanear usuario
  const toggleUserBan = async (userId, isBanned) => {
    try {
      await apiCall(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ is_banned: !isBanned })
      });
      
      setMessage(`Usuario ${isBanned ? 'desbaneado' : 'baneado'} exitosamente`);
      loadUsers(); // Recargar lista
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId, username) => {
    try {
      await apiCall(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      setMessage(`Usuario "${username}" eliminado exitosamente`);
      loadUsers(); // Recargar lista
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Eliminar foto directamente
  const deletePhotoDirectly = async (photoId, filename) => {
    try {
      await apiCall(`/api/admin/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      setMessage(`Foto "${filename}" eliminada exitosamente`);
      
      // Recargar la página después de eliminar
      setTimeout(() => {
        sessionStorage.setItem('redirectToAdminPhotos', 'true');
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Seleccionar/deseleccionar foto
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // Seleccionar todas las fotos
  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map(photo => photo.id)));
  };

  // Deseleccionar todas las fotos
  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  // Eliminar múltiples fotos directamente
  const deleteMultiplePhotosDirectly = async () => {
    if (selectedPhotos.size === 0) return;
    
    try {
      setLoading(true);
      const photoIds = Array.from(selectedPhotos);
      
      // Eliminar fotos una por una
      for (const photoId of photoIds) {
        await apiCall(`/api/admin/photos/${photoId}`, {
          method: 'DELETE'
        });
      }
      
      const count = photoIds.length;
      setMessage(`${count} foto${count !== 1 ? 's' : ''} eliminada${count !== 1 ? 's' : ''} exitosamente`);
      
      // Limpiar selección
      setSelectedPhotos(new Set());
      
      // Recargar la página después de eliminar múltiples fotos
      setTimeout(() => {
        sessionStorage.setItem('redirectToAdminPhotos', 'true');
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  // Cargar datos según la pestaña activa
  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'users':
        loadUsers();
        break;
      case 'photos':
        loadPhotos();
        break;
      case 'logs':
        loadLogs();
        break;
      default:
        break;
    }
  }, [activeTab]);

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  // Limpiar mensaje después de 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // useEffect para detectar redirección a la pestaña de fotos después de recarga
  useEffect(() => {
    const redirectToAdminPhotos = sessionStorage.getItem('redirectToAdminPhotos');
    if (redirectToAdminPhotos === 'true') {
      console.log('🔄 Redirigiendo a la pestaña de fotos después de recarga...');
      sessionStorage.removeItem('redirectToAdminPhotos'); // Limpiar la bandera
      
      // Usar setTimeout para asegurar que el componente esté completamente montado
      setTimeout(() => {
        setActiveTab('photos');
        // Cargar las fotos para asegurar que se muestren los datos actualizados
        loadPhotos();
      }, 100);
    }
  }, []); // Solo se ejecuta una vez al montar el componente

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h1>👑 Panel de Administración</h1>
        <div className="admin-user-info">
          <span>Administrador: {user.username}</span>
          <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`admin-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
        <button 
          className={activeTab === 'photos' ? 'active' : ''} 
          onClick={() => setActiveTab('photos')}
        >
          📸 Fotos
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="admin-content">
        {loading && <div className="loading">Cargando...</div>}

        {/* Dashboard */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>👥 Usuarios</h3>
                <p className="stat-number">{dashboardData.stats.total_users}</p>
              </div>
              <div className="stat-card">
                <h3>📸 Fotos</h3>
                <p className="stat-number">{dashboardData.stats.total_photos}</p>
              </div>
              <div className="stat-card">
                <h3>📁 Secciones</h3>
                <p className="stat-number">{dashboardData.stats.total_sections}</p>
              </div>
              <div className="stat-card">
                <h3>🚫 Usuarios Baneados</h3>
                <p className="stat-number">{dashboardData.stats.banned_users}</p>
              </div>
            </div>


          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3>👥 Gestión de Usuarios</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Fotos</th>
                    <th>Likes</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={user.is_banned ? 'banned' : ''}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.total_photos}</td>
                      <td>{user.total_likes}</td>
                      <td>
                        <span className={`status ${user.is_banned ? 'banned' : 'active'}`}>
                          {user.is_banned ? '🚫 Baneado' : '✅ Activo'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <button 
                          onClick={() => toggleUserBan(user.id, user.is_banned)}
                          className={`action-btn ${user.is_banned ? 'unban' : 'ban'}`}
                        >
                          {user.is_banned ? '✅ Desbanear' : '🚫 Banear'}
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id, user.username)}
                          className="action-btn delete"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fotos */}
        {activeTab === 'photos' && (
          <div className="photos-section">
            <h3>📸 Gestión de Fotos</h3>
            
            {/* Controles de selección múltiple */}
            <div className="bulk-actions">
              <div className="selection-controls">
                <button 
                  onClick={selectAllPhotos}
                  className="select-all-btn"
                  disabled={photos.length === 0}
                >
                  📋 Seleccionar Todas
                </button>
                <button 
                  onClick={deselectAllPhotos}
                  className="deselect-all-btn"
                  disabled={selectedPhotos.size === 0}
                >
                  ❌ Deseleccionar Todas
                </button>
                <span className="selection-count">
                  {selectedPhotos.size} de {photos.length} foto{photos.length !== 1 ? 's' : ''} seleccionada{selectedPhotos.size !== 1 ? 's' : ''}
                </span>
              </div>
              
              {selectedPhotos.size > 0 && (
                <button 
                  onClick={deleteMultiplePhotosDirectly}
                  className="bulk-delete-btn"
                >
                  🗑️ Eliminar {selectedPhotos.size} Foto{selectedPhotos.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
            
            <div className="photos-grid">
              {photos.map(photo => (
                <div key={photo.id} className={`photo-card ${selectedPhotos.has(photo.id) ? 'selected' : ''}`}>
                  {/* Checkbox de selección */}
                  <div className="photo-selection">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.has(photo.id)}
                      onChange={() => togglePhotoSelection(photo.id)}
                      className="photo-checkbox"
                    />
                  </div>
                  
                  <img 
                    src={`http://localhost:4001/uploads/${photo.filename}`} 
                    alt={photo.filename}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2lpx0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imqDlm748L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="photo-info">
                    <p><strong>Usuario:</strong> {photo.username}</p>
                    <p><strong>Sección:</strong> {photo.section_name}</p>
                    <p><strong>Votos:</strong> {photo.votes}</p>
                    <p><strong>Comentarios:</strong> {photo.comments}</p>
                    <p><strong>Fecha:</strong> {formatDate(photo.created_at)}</p>
                    <button 
                      onClick={() => deletePhotoDirectly(photo.id, photo.filename)}
                      className="action-btn delete"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                 {/* Logs */}
         {activeTab === 'logs' && (
           <div className="logs-section">
             <div className="logs-header">
               <h3>📝 Logs de Administración</h3>
               <button 
                 onClick={clearAllLogs}
                 className="clear-logs-btn"
                 disabled={loading}
               >
                 🗑️ Borrar Todos los Logs
               </button>
             </div>
             <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Admin</th>
                    <th>Acción</th>
                    <th>Tipo</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.admin_username}</td>
                      <td>
                        <span className={`action-badge ${log.action}`}>
                          {log.action === 'ban_user' && '🚫 Banear'}
                          {log.action === 'unban_user' && '✅ Desbanear'}
                          {log.action === 'delete_user' && '🗑️ Eliminar Usuario'}
                          {log.action === 'delete_photo' && '🗑️ Eliminar Foto'}
                          {log.action}
                        </span>
                      </td>
                      <td>{log.target_type}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}




      </div>
    </div>
  );
};

export default AdminPanel;
