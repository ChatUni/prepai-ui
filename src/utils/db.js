import { getApiBaseUrl } from '../config.js';

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - Promise resolving to API response
 */
async function fetchFromApi(endpoint) {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('API requests are only supported in browser environment');
      return [];
    }
    
    // Get the API base URL
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}${endpoint}`;
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      // First, get the content type to check if we're getting HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.error('Received HTML instead of JSON:', htmlContent.substring(0, 100) + '...');
        throw new Error(`API returned HTML instead of JSON. Status: ${response.status}, URL: ${url}`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status} for URL: ${url}`);
    }
    
    // Be more defensive when parsing JSON
    try {
      return await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      const textResponse = await response.text();
      throw new Error(`Invalid JSON response. First 100 chars: ${textResponse.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('API request error:', error);
    
    // Add more detailed logging for API request failures
    if (error.message.includes('API returned HTML')) {
      console.error('This typically happens when the server returns an HTML error page instead of JSON');
      console.error('Check if your backend server is running and properly configured');
      console.error('For Netlify functions, make sure they are deployed correctly');
    }
    
    // Return empty array as fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback data in development mode');
      return getFallbackData(endpoint);
    }
    
    // Add more context to the error
    const enhancedError = new Error(`API request failed for endpoint ${endpoint}: ${error.message}`);
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

/**
 * Get fallback data for development
 * @param {string} endpoint - API endpoint
 * @returns {Array|Object} - Fallback data
 */
function getFallbackData(endpoint) {
  console.warn(`No fallback data available for endpoint: ${endpoint}`);
  if (endpoint === '/courses') {
    return [];
  }
  
  if (endpoint.startsWith('/courses/')) {
    return null;
  }
  
  if (endpoint === '/instructors') {
    return [];
  }
  
  return [];
}

/**
 * Get all courses from the API
 * @returns {Promise<Array>} - Promise resolving to array of courses
 */
export async function getAllCourses() {
  return fetchFromApi('/courses');
}

/**
 * Get a course by ID from the API
 * @param {number} id - Course ID
 * @returns {Promise<Object>} - Promise resolving to course object
 */
export async function getCourseById(id) {
  return fetchFromApi(`/courses/${id}`);
}

/**
 * Get all instructors from the API
 * @returns {Promise<Array>} - Promise resolving to array of instructors
 */
export async function getAllInstructors() {
  return fetchFromApi('/instructors');
}

/**
 * Test API connection to verify configuration
 * @returns {Promise<Object>} - Connection test results
 */
export async function testApiConnection() {
  const apiBaseUrl = getApiBaseUrl();
  
  console.log('Testing API connection...');
  console.log(`API Base URL: ${apiBaseUrl}`);
  
  try {
    const result = await fetchFromApi('/courses');
    return {
      success: true,
      apiBaseUrl,
      message: 'Successfully connected to API',
      dataReceived: !!result
    };
  } catch (error) {
    return {
      success: false,
      apiBaseUrl,
      message: `Failed to connect to API: ${error.message}`,
      error: error.message
    };
  }
}

export default {
  fetchFromApi,
  getAllCourses,
  getCourseById,
  getAllInstructors,
  testApiConnection
};
