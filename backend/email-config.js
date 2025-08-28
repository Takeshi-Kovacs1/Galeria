// Configuración de email - DESHABILITADA TEMPORALMENTE
const EMAIL_CONFIG = {
  service: 'none',
  auth: {
    user: 'email@deshabilitado.com',
    pass: 'password'
  }
};

// Función para verificar si la configuración de email es válida
function isEmailConfigured() {
  return false; // Email deshabilitado
}

// Función para obtener la configuración
function getEmailConfig() {
  return EMAIL_CONFIG;
}

export {
  EMAIL_CONFIG,
  isEmailConfigured,
  getEmailConfig
};
