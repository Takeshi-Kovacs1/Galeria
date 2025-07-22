import axios from 'axios';

const API = 'http://localhost:4001/api';

async function testAPI() {
  try {
    console.log('🧪 Probando API del backend...\n');
    
    // Probar que el servidor esté funcionando
    console.log('1. Probando conexión básica...');
    try {
      const response = await axios.get(API + '/photos');
      console.log('✅ Servidor funcionando, fotos disponibles:', response.data.length);
    } catch (err) {
      console.log('❌ Error conectando al servidor:', err.message);
      return;
    }
    
    // Probar login para obtener un token
    console.log('\n2. Probando login...');
    try {
      const loginResponse = await axios.post(API + '/login', {
        username: 'test',
        password: 'test'
      });
      console.log('✅ Login exitoso, token obtenido');
      const token = loginResponse.data.token;
      
      // Probar marcar una foto
      console.log('\n3. Probando marcar foto...');
      try {
        const tagResponse = await axios.post(API + '/photos/1/tag', {}, {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('✅ Marcar foto exitoso:', tagResponse.data);
      } catch (err) {
        console.log('❌ Error marcando foto:', err.response?.data || err.message);
      }
      
      // Probar obtener fotos marcadas
      console.log('\n4. Probando obtener fotos marcadas...');
      try {
        const taggedResponse = await axios.get(API + '/user/tagged-photos', {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('✅ Fotos marcadas obtenidas:', taggedResponse.data.length);
        console.log('📋 Detalles:', taggedResponse.data);
      } catch (err) {
        console.log('❌ Error obteniendo fotos marcadas:', err.response?.data || err.message);
      }
      
    } catch (err) {
      console.log('❌ Error en login:', err.response?.data || err.message);
    }
    
  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

testAPI(); 