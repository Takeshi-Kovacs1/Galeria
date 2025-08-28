import axios from 'axios';

const API_URL = 'http://localhost:4001/api';

async function testRegister() {
  try {
    console.log('Probando registro de usuario...');
    
    const response = await axios.post(`${API_URL}/register`, {
      username: 'testuser123',
      password: 'testpass123'
    });
    
    console.log('✅ Registro exitoso:', response.data);
    
    // Ahora probar login
    console.log('\nProbando login...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'testuser123',
      password: 'testpass123'
    });
    
    console.log('✅ Login exitoso:', loginResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRegister(); 