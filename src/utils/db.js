import { getApiBaseUrl } from '../config.js';

const api = (type, ps = {}) => {
  const p = Object.keys(ps).map(x => `${x}=${encodeURIComponent(ps[x])}`).join('&')
  return `${getApiBaseUrl()}?type=${type}${p ? `&${p}` : ''}`
}

export const get = (type, ps) => fetch(api(type, ps)).then(r => r.json())
export const post = (type, ps, data) => fetch(api(type, ps), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
}).then(r => r.json())
export const save = (doc, data) => post('save', { doc }, data)
export const remove = (doc, id) => post('remove', { doc }, { id })

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - Promise resolving to API response
 */
export const fetchFromApi = async (endpoint) => {
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
    
    // Set up a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache', // Prevent caching issues
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch succeeds
      
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
    } catch (fetchError) {
      clearTimeout(timeoutId); // Clear the timeout in case of error
      
      // Handle abort error specially
      if (fetchError.name === 'AbortError') {
        console.error(`Fetch request to ${url} timed out after 15 seconds`);
        throw new Error(`Request timed out after 15 seconds. The server might be experiencing issues.`);
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('API request error:', error);
    
    // Add more detailed logging for API request failures
    if (error.message.includes('API returned HTML')) {
      console.error('This typically happens when the server returns an HTML error page instead of JSON');
      console.error('Check if your backend server is running and properly configured');
      console.error('For Netlify functions, make sure they are deployed correctly');
    }
    
    // Add more context to the error
    const enhancedError = new Error(`API request failed for endpoint ${endpoint}: ${error.message}`);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

/**
 * Get all courses from the API
 * @returns {Promise<Array>} - Promise resolving to array of courses
 */
export const getAllCourses = async () => fetchFromApi('/courses');

/**
 * Get a course by ID from the API
 * @param {number} id - Course ID
 * @returns {Promise<Object>} - Promise resolving to course object
 */
export const getCourseById = async (id) => fetchFromApi(`/courses/${id}`);

/**
 * Get courses by series ID from the API
 * @param {number} seriesId - Series ID
 * @returns {Promise<Array>} - Promise resolving to array of courses
 */
export const getCoursesBySeriesId = async (seriesId) => fetchFromApi(`/courses?seriesId=${seriesId}`);

/**
 * Get all instructors from the API
 * @returns {Promise<Array>} - Promise resolving to array of instructors
 */
export const getAllInstructors = async () => fetchFromApi('/instructors');

/**
 * Get all series from the API
 * @returns {Promise<Array>} - Promise resolving to array of series
 */
export const getAllSeries = async () => fetchFromApi('/series');

/**
 * Get a series by ID from the API
 * @param {number} id - Series ID
 * @returns {Promise<Object>} - Promise resolving to series object with included courses
 */
export const getSeriesById = async (id) => fetchFromApi(`/series/${id}`);

/**
 * Test API connection to verify configuration
 * @returns {Promise<Object>} - Connection test results
 */
export const testApiConnection = async () => {
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
};

/**
 * Get all assistants from the API
 * @returns {Promise<Array>} - Promise resolving to array of assistants
 */
export const getAllAssistants = async () => fetchFromApi('/assistants');

/**
 * Get an assistant by ID from the API
 * @param {number} id - Assistant ID
 * @returns {Promise<Object>} - Promise resolving to assistant object
 */
export const getAssistant = async (id) => fetchFromApi(`/assistants/${id}`);

/**
 * Get an instructor by ID from the API
 * @param {number} id - Instructor ID
 * @returns {Promise<Object>} - Promise resolving to instructor object
 */
export const getInstructor = async (id) => fetchFromApi(`/instructors/${id}`);

/**
 * Save instructor data to the API (create or update)
 * @param {Object} data - Instructor data to save
 * @param {number} [data.id] - Instructor ID (if updating)
 * @returns {Promise<Object>} - Promise resolving to saved instructor object
 */
export const saveInstructor = async (data) => {
  const method = data.id ? 'PUT' : 'POST';
  const url = data.id ? `/instructors/${data.id}` : '/instructors';
  
  try {
    const response = await fetch(`${getApiBaseUrl()}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to save instructor: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving instructor:', error);
    throw error;
  }
};

export default {
  fetchFromApi,
  getAllCourses,
  getCourseById,
  getCoursesBySeriesId,
  getAllInstructors,
  getInstructor,
  saveInstructor,
  getAllSeries,
  getSeriesById,
  getAllAssistants,
  getAssistant,
  testApiConnection
};
