import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'tu_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'tu_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'tu_api_secret'
});

export default cloudinary;
