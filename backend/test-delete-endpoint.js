import { query } from './db-config.js';

const testDeleteEndpoint = async () => {
  try {
    console.log('🧪 Probando endpoint de eliminación de sección...');
    
    // Intentar eliminar la sección "Urbano" (ID: 2)
    const sectionId = 2;
    
    console.log(`🗑️ Intentando eliminar sección ID: ${sectionId}`);
    
    // Verificar si la sección existe
    const sectionResult = await query('SELECT * FROM sections WHERE id = $1', [sectionId]);
    if (sectionResult.rows.length === 0) {
      console.log('❌ Sección no encontrada');
      return;
    }
    
    console.log('✅ Sección encontrada:', sectionResult.rows[0]);
    
    // Verificar si hay fotos
    const photosResult = await query('SELECT COUNT(*) as count FROM photos WHERE section_id = $1', [sectionId]);
    console.log(`📸 Fotos en la sección: ${photosResult.rows[0].count}`);
    
    if (parseInt(photosResult.rows[0].count) > 0) {
      console.log('❌ No se puede eliminar - tiene fotos');
      return;
    }
    
    // Simular la eliminación paso a paso como lo hace el endpoint
    console.log('🔍 Verificando si la sección existe...');
    const section = await query('SELECT * FROM sections WHERE id = $1', [sectionId]);
    if (!section.rows[0]) {
      console.log('❌ Sección no encontrada');
      return;
    }
    
    console.log('✅ Sección encontrada para eliminación');
    
    // Verificar si hay fotos en esta sección
    const photos = await query('SELECT COUNT(*) as count FROM photos WHERE section_id = $1', [sectionId]);
    if (parseInt(photos.rows[0].count) > 0) {
      console.log('❌ No se puede eliminar - tiene fotos');
      return;
    }
    
    console.log('✅ No hay fotos - se puede eliminar');
    
    // Eliminar la sección
    const deleteResult = await query('DELETE FROM sections WHERE id = $1', [sectionId]);
    console.log('✅ Sección eliminada exitosamente');
    console.log('📊 Filas afectadas:', deleteResult.rowCount);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    console.error('❌ Stack trace:', error.stack);
  }
};

testDeleteEndpoint();
