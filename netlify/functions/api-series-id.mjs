import { executeQuery } from './utils/db.mjs';

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' })
      };
    }

    // Extract series ID from path
    const seriesId = event.path.split('/').pop();
    
    if (!seriesId || isNaN(parseInt(seriesId))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid series ID' })
      };
    }

    // Get series details with instructor information
    const seriesQuery = `
      SELECT s.*, i.name as instructor_name, i.bio as instructor_bio, i.avatar as instructor_avatar
      FROM series s
      LEFT JOIN instructors i ON s.instructor_id = i.id
      WHERE s.id = ?
    `;
    
    const seriesData = await executeQuery(seriesQuery, [seriesId]);
    
    if (seriesData.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Series not found' })
      };
    }
    
    // Get courses belonging to this series
    const coursesQuery = `
      SELECT c.*
      FROM courses c
      WHERE c.series_id = ?
      ORDER BY c.title
    `;
    
    const coursesData = await executeQuery(coursesQuery, [seriesId]);
    
    // Combine series data with courses
    const result = {
      ...seriesData[0],
      courses: coursesData
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in api-series-id:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}