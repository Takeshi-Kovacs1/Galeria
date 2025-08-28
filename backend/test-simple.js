async function testRegister() {
  try {
    console.log('Probando registro de usuario...');
    
    const response = await fetch('http://localhost:4001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser123',
        password: 'testpass123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registro exitoso:', data);
    } else {
      console.log('❌ Error en registro:', data);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testRegister(); 