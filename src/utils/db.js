// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

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
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    
    // Return empty array as fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback data in development mode');
      return getFallbackData(endpoint);
    }
    
    throw error;
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

export default {
  fetchFromApi,
  getAllCourses,
  getCourseById,
  getAllInstructors
};
