# 📸 Galería de Fotos - Despliegue Web

Esta es una aplicación de galería de fotos con funcionalidades de votación, etiquetado y carrusel automático.

## 🚀 Despliegue en la Web

### **Frontend (React) → Vercel**
### **Backend (Node.js) → Railway**  
### **Base de datos (SQLite) → PostgreSQL en la nube**

---

## 📋 **Paso 1: Desplegar el Backend en Railway**

### 1.1 Crear cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Regístrate con tu cuenta de GitHub
- Crea un nuevo proyecto

### 1.2 Conectar el repositorio
- Selecciona "Deploy from GitHub repo"
- Conecta tu repositorio de GitHub
- Selecciona la carpeta `backend`

### 1.3 Configurar variables de entorno
En Railway, ve a la pestaña "Variables" y agrega:
```
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
PORT=3000
```

### 1.4 Desplegar
- Railway detectará automáticamente que es una aplicación Node.js
- El archivo `railway.json` configurará el despliegue
- La aplicación se desplegará automáticamente

### 1.5 Obtener la URL del backend
- Una vez desplegado, Railway te dará una URL como: `https://tu-app.railway.app`
- Guarda esta URL para el siguiente paso

---

## 📋 **Paso 2: Desplegar el Frontend en Vercel**

### 2.1 Crear cuenta en Vercel
- Ve a [vercel.com](https://vercel.com)
- Regístrate con tu cuenta de GitHub
- Crea un nuevo proyecto

### 2.2 Conectar el repositorio
- Selecciona tu repositorio de GitHub
- Vercel detectará automáticamente que es una aplicación React

### 2.3 Configurar variables de entorno
En Vercel, ve a "Settings" → "Environment Variables" y agrega:
```
REACT_APP_API_URL=https://tu-app.railway.app/api
REACT_APP_UPLOADS_URL=https://tu-app.railway.app/uploads
```
(Reemplaza `tu-app.railway.app` con tu URL real de Railway)

### 2.4 Desplegar
- Vercel desplegará automáticamente tu aplicación
- Te dará una URL como: `https://tu-app.vercel.app`

---

## 📋 **Paso 3: Configurar Base de Datos (Opcional)**

### 3.1 Migrar a PostgreSQL (Recomendado para producción)
Si quieres usar PostgreSQL en lugar de SQLite:

1. **En Railway:**
   - Ve a tu proyecto
   - Haz clic en "New"
   - Selecciona "Database" → "PostgreSQL"
   - Railway creará automáticamente las variables de entorno

2. **Modificar el backend:**
   - Instalar: `npm install pg`
   - Cambiar la configuración de base de datos en `index.js`

### 3.2 Mantener SQLite (Más simple)
- SQLite funcionará bien para aplicaciones pequeñas
- Los datos se almacenarán en el servidor de Railway

---

## 📱 **Acceso desde Móviles**

Una vez desplegado:
- **Frontend:** Accesible desde cualquier dispositivo en `https://tu-app.vercel.app`
- **Backend:** API disponible en `https://tu-app.railway.app/api`
- **Imágenes:** Servidas desde `https://tu-app.railway.app/uploads`

---

## 🔧 **Comandos Útiles**

### Desarrollo Local
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

### Producción
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run build
```

---

## 🌐 **URLs de Producción**

Después del despliegue, tu aplicación estará disponible en:
- **Frontend:** `https://tu-app.vercel.app`
- **Backend:** `https://tu-app.railway.app`
- **API:** `https://tu-app.railway.app/api`

---

## 📞 **Soporte**

Si tienes problemas con el despliegue:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs en Railway y Vercel
3. Asegúrate de que el backend esté funcionando antes de desplegar el frontend

¡Tu galería de fotos estará disponible en la web y accesible desde cualquier dispositivo! 🎉 