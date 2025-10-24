// API Configuration
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const BASE_URL = isLocalhost ? 'http://localhost' : (import.meta.env.VITE_BASE_URL || '');
export const isProd = !BASE_URL
// Get the API Base URL
export const getApiBaseUrl = () => `${BASE_URL}/api`;
export const getOpenAIBaseUrl = () => `${BASE_URL}/openai`;
