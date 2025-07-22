import axios from 'axios';

const API = 'http://localhost:4000/api';

// Simular un token válido (necesitarás reemplazar esto con un token real)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0In0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testRoutes() {
  try {
    console.log('Probando rutas del backend...');
    
    // Probar obtener fotos marcadas
    console.log('\n1. Probando GET /api/user/tagged-photos');
    try {
      const response = await axios.get(API + '/user/tagged-photos', {
        headers: { Authorization: 'Bearer ' + testToken }
      });
      console.log('✅ Respuesta:', response.data);
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
    }
    
    // Probar marcar una foto
    console.log('\n2. Probando POST /api/photos/1/tag');
    try {
      const response = await axios.post(API + '/photos/1/tag', {}, {
        headers: { Authorization: 'Bearer ' + testToken }
      });
      console.log('✅ Respuesta:', response.data);
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
    }
    
    // Probar verificar si una foto está marcada
    console.log('\n3. Probando GET /api/photos/1/tagged');
    try {
      const response = await axios.get(API + '/photos/1/tagged', {
        headers: { Authorization: 'Bearer ' + testToken }
      });
      console.log('✅ Respuesta:', response.data);
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
    }
    
  } catch (err) {
    console.error('Error general:', err);
  }
}

testRoutes(); 