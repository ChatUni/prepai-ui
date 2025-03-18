import { executeQuery } from './utils/db.mjs';

/**
 * Handler for GET /assistants endpoint
 * Returns all assistants from the database
 */
export async function handler(event, context) {
  // Allow only GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Query all assistants using the executeQuery function
    const assistants = await executeQuery('SELECT id, name, greeting, prompt FROM Assistants');
    
    return {
      statusCode: 200,
      body: JSON.stringify(assistants),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error fetching assistants:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch assistants', details: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}