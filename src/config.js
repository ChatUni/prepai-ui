// API Configuration
export const BASE_URL = import.meta.env.VITE_BASE_URL;
console.log(BASE_URL);
// Get the API Base URL
export const getApiBaseUrl = () => `${BASE_URL}/api`;
export const getOpenAIBaseUrl = () => `${BASE_URL}/openai`;
