# 📧 Configuración de Email para Galería Actuarial

## 🔐 Configuración de Gmail

Para que el sistema de email funcione, necesitas configurar las credenciales de Gmail:

### 1. Habilitar Autenticación de 2 Factores
- Ve a tu cuenta de Google
- Activa la verificación en 2 pasos

### 2. Generar Contraseña de Aplicación
- Ve a "Seguridad" en tu cuenta de Google
- Busca "Contraseñas de aplicación"
- Genera una nueva contraseña para "Galería Actuarial"

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la carpeta `backend` con:

```bash
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password-generada
JWT_SECRET=tu-secreto-jwt
PORT=4001
```

### 4. Ejecutar Migración de Base de Datos
```bash
cd backend
node migrate-email.js
```

## 🚀 Funcionalidades Implementadas

### ✅ Registro de Usuario
- Campo de email obligatorio
- Validación de formato de email
- Email de bienvenida automático
- Credenciales enviadas por email

### ✅ Recuperación de Contraseña
- Formulario de recuperación por email
- Generación automática de nueva contraseña
- Email con nueva contraseña
- Actualización automática en base de datos

### ✅ Validaciones
- Email único por usuario
- Formato de email válido
- Mensajes de error específicos
- Mensajes de éxito informativos

## 📱 Interfaz de Usuario

### Login
- Campo de usuario
- Campo de contraseña
- Link para registro
- **Link para recuperar contraseña**

### Registro
- Campo de usuario
- **Campo de email**
- Campo de contraseña
- Link para volver al login

### Recuperación de Contraseña
- Campo de email
- Botón para enviar nueva contraseña
- Link para volver al login

## 🔧 Solución de Problemas

### Error de Email
- Verifica que las credenciales sean correctas
- Asegúrate de que la autenticación de 2 factores esté activada
- Usa la contraseña de aplicación, no tu contraseña principal

### Base de Datos
- Ejecuta `node migrate-email.js` si hay errores
- Verifica que la tabla `users` tenga la columna `email`

### CORS
- El backend ya tiene CORS configurado
- Verifica que el frontend esté en el puerto correcto 