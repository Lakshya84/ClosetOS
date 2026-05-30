const cloudinary = require('cloudinary').v2;

const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key';

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary service initialized successfully.');
} else {
  console.warn('WARNING: Cloudinary credentials not fully configured. Image uploads will fallback to high-end placeholders.');
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured: () => isConfigured
};
