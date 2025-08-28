# 📧 Configuración de Email para Galería Actuarial

## 🔧 Configuración para Gmail

### Paso 1: Habilitar Autenticación de 2 Factores
1. Ve a tu cuenta de Google
2. Seguridad > Verificación en 2 pasos
3. Activa la verificación en 2 pasos

### Paso 2: Generar Contraseña de Aplicación
1. Seguridad > Verificación en 2 pasos
2. Contraseñas de aplicación
3. Selecciona "Otra (nombre personalizado)"
4. Escribe "Galería Actuarial"
5. Copia la contraseña generada (16 caracteres)

### Paso 3: Configurar el Backend
1. Edita el archivo `backend/email-config.js`
2. Cambia `'tu-email@gmail.com'` por tu email real
3. Cambia `'tu-app-password'` por la contraseña de aplicación

```javascript
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: 'tu-email-real@gmail.com',  // ← Tu email real
    pass: 'abcd efgh ijkl mnop'       // ← Tu contraseña de aplicación
  }
};
```

### Paso 4: Variables de Entorno (Opcional)
También puedes usar variables de entorno:

```bash
# En tu sistema o archivo .env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
```

## 🚨 Solución de Problemas

### Error: "Invalid login"
- Verifica que la contraseña de aplicación sea correcta
- Asegúrate de que la autenticación de 2 factores esté activada

### Error: "Username and Password not accepted"
- Usa tu email completo, no solo el nombre de usuario
- La contraseña de aplicación debe tener exactamente 16 caracteres

### Error: "Less secure app access"
- Gmail ya no permite acceso de aplicaciones menos seguras
- Siempre usa contraseñas de aplicación

## ✅ Verificación

Después de configurar, reinicia el backend y verifica en la consola:
- ✅ Configuración de email válida
- ✅ Email de bienvenida enviado a [email]

## 📝 Notas Importantes

- **NUNCA** uses tu contraseña principal de Gmail
- **SÍEMPRE** usa contraseñas de aplicación
- Las contraseñas de aplicación son de un solo uso
- Si cambias tu contraseña principal, regenera la contraseña de aplicación

