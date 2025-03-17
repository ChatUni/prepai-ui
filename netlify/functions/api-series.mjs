import { executeQuery } from './utils/db.mjs';

export async function handler(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      // Check if we need to filter by instructor
      const params = event.queryStringParameters || {};
      const instructorId = params.instructor;
      
      let query = `
        SELECT s.*, i.name as instructor_name, i.bio as instructor_bio, i.avatar as instructor_avatar
        FROM series s
        LEFT JOIN instructors i ON s.instructor_id = i.id
      `;
      
      const queryParams = [];
      
      // Add instructor filter if provided
      if (instructorId) {
        query += ` WHERE s.instructor_id = ?`;
        queryParams.push(instructorId);
      }
      
      // Add order by clause
      query += ` ORDER BY s.name`;
      
      const seriesData = await executeQuery(query, queryParams);

      return {
        statusCode: 200,
        body: JSON.stringify(seriesData)
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  } catch (error) {
    console.error('Error in api-series:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}