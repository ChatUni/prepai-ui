import { executeQuery } from './utils/db.mjs';

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' })
      };
    }

    // Parse query parameters (if any)
    const queryParams = event.queryStringParameters || {};
    const seriesId = queryParams.seriesId;
    
    let query = `
      SELECT c.*, c.isVideo, s.name as series_name, i.name as instructor_name, i.avatar as instructor_avatar
      FROM courses c
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN instructors i ON s.instructor_id = i.id
    `;
    
    const queryParams2 = [];
    
    // Add series filter if seriesId is provided
    if (seriesId) {
      query += ' WHERE c.series_id = ?';
      queryParams2.push(seriesId);
    }
    
    query += ' ORDER BY c.title';
    
    const courses = await executeQuery(query, queryParams2);
    
    return {
      statusCode: 200,
      body: JSON.stringify(courses)
    };
  } catch (error) {
    console.error('Error in api-courses:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}