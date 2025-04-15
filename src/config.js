// API Configuration
export const BASE_URL = process.env.BASE_URL;

// Get the API Base URL
export const getApiBaseUrl = () => `${BASE_URL}/api`;
export const getOpenAIBaseUrl = () => `${BASE_URL}/openai`;

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'prepai',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};