import { executeQuery } from './utils/db.mjs';

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' })
      };
    }

    // Extract course ID from path
    const courseId = event.path.split('/').pop();
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid course ID' })
      };
    }

    // Get course details with series and instructor information
    const query = `
      SELECT c.*, s.id as series_id, s.name as series_name, 
             i.id as instructor_id, i.name as instructor_name, i.avatar as instructor_avatar, i.bio as instructor_bio
      FROM courses c
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN instructors i ON s.instructor_id = i.id
      WHERE c.id = ?
    `;
    
    const courseData = await executeQuery(query, [courseId]);
    
    if (courseData.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Course not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(courseData[0])
    };
  } catch (error) {
    console.error('Error in api-courses-id:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}