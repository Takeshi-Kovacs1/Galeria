import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:4001/api';

async function testProfilePictureEndpoints() {
  try {
    console.log('🧪 Probando endpoints de fotos de perfil...\n');
    
    // 1. Probar login para obtener token
    console.log('1️⃣ Probando login...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido\n');
    
    // 2. Probar obtener foto de perfil actual
    console.log('2️⃣ Probando obtener foto de perfil...');
    try {
      const getProfileResponse = await axios.get(`${API_BASE}/user/profile-picture`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Foto de perfil obtenida:', getProfileResponse.data);
    } catch (err) {
      console.log('ℹ️ No hay foto de perfil configurada aún');
    }
    console.log('');
    
    // 3. Probar subir foto de perfil (simulando con un archivo de texto)
    console.log('3️⃣ Probando subir foto de perfil...');
    console.log('⚠️ Nota: Este es solo un test de la API, no se subirá una imagen real');
    
    // Crear un FormData simulado
    const form = new FormData();
    
    // Crear un archivo de prueba
    const testImagePath = './test-image.txt';
    fs.writeFileSync(testImagePath, 'Esta es una imagen de prueba');
    
    form.append('profile_picture', fs.createReadStream(testImagePath));
    
    try {
      const uploadResponse = await axios.post(`${API_BASE}/user/profile-picture`, form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...form.getHeaders()
        }
      });
      console.log('✅ Foto de perfil subida:', uploadResponse.data);
      
      // Limpiar archivo de prueba
      fs.unlinkSync(testImagePath);
      
    } catch (err) {
      console.log('❌ Error subiendo foto de perfil:', err.response?.data || err.message);
    }
    
    console.log('\n🎉 Pruebas completadas');
    
  } catch (err) {
    console.error('❌ Error en las pruebas:', err.response?.data || err.message);
  }
}

testProfilePictureEndpoints();
