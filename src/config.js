// API Configuration
export const BASE_URL = process.env.BASE_URL;

// Get the API Base URL
export const getApiBaseUrl = () => `${BASE_URL}/api`;
export const getOpenAIBaseUrl = () => `${BASE_URL}/openai`;
