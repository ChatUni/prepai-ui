import mysql from 'mysql2/promise';
import { parsePathParams } from './utils/pathUtils.js';
import { getResponseHeaders } from './utils/headers.js';

// Database configuration
const getDbConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'prepai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 60000
});

// Create database pool
let pool;

// Initialize database connection
const initializeDatabase = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool(getDbConfig());
      const [rows] = await pool.execute('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
};

// Initialize database on cold start
initializeDatabase();

// Helper function to parse query parameters
const parseQueryParams = (queryStringParameters) => {
  const params = queryStringParameters || {};
  return {
    userId: parseInt(params.userId || 1),
    courseId: params.courseId ? parseInt(params.courseId) : null,
    count: params.count ? parseInt(params.count) : null,
    instructor: params.instructor
  };
};

// Main handler function
export const handler = async (event, context) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getResponseHeaders()
    };
  }

  // Set response headers
  const headers = getResponseHeaders();

  try {
    const { resource, id } = parsePathParams(event.path, 'api');
    const { userId, courseId, count, instructor } = parseQueryParams(event.queryStringParameters);
    const body = event.body ? JSON.parse(event.body) : {};

    await initializeDatabase();
    console.log(`${event.httpMethod} /${resource}${id ? '/:id' : ''}`);

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'GET /courses':        
        const [courseRows] = await pool.execute(`
          SELECT c.*,
                 i.name AS instructor,
                 CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite,
                 COALESCE(c.recommended, FALSE) AS recommended,
                 COALESCE(c.isVideo, TRUE) AS isVideo,
                 c.transcript
          FROM courses c
          LEFT JOIN favorites f ON c.id = f.course_id AND f.user_id = ?
          LEFT JOIN series s ON c.series_id = s.id
          LEFT JOIN instructors i ON i.id = s.instructor_id
        `, [userId]);
        
        return { statusCode: 200, headers, body: JSON.stringify(courseRows) };

      case 'GET /courses/:id':
        const [courseDetailRows] = await pool.execute(`
          SELECT c.*,
                 i.name AS instructor,
                 CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite,
                 COALESCE(c.recommended, FALSE) AS recommended,
                 COALESCE(c.isVideo, TRUE) AS isVideo,
                 c.transcript
          FROM courses c
          LEFT JOIN favorites f ON c.id = f.course_id AND f.user_id = ?
          LEFT JOIN series s ON c.series_id = s.id
          LEFT JOIN instructors i ON i.id = s.instructor_id
          WHERE c.id = ?
        `, [userId, parseInt(id)]);
        
        if (courseDetailRows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Course not found' }) };
        }
        
        return { statusCode: 200, headers, body: JSON.stringify(courseDetailRows[0]) };

      case 'POST /favorites/toggle':
        if (!body.courseId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Course ID is required' }) };
        }

        const [existingFavorites] = await pool.execute(
          'SELECT id FROM favorites WHERE user_id = ? AND course_id = ?',
          [body.userId || 1, body.courseId]
        );

        if (existingFavorites.length > 0) {
          await pool.execute(
            'DELETE FROM favorites WHERE user_id = ? AND course_id = ?',
            [body.userId || 1, body.courseId]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ isFavorite: false, message: 'Removed from favorites' }) };
        } else {
          await pool.execute(
            'INSERT INTO favorites (user_id, course_id) VALUES (?, ?)',
            [body.userId || 1, body.courseId]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ isFavorite: true, message: 'Added to favorites' }) };
        }

      case 'GET /favorites':
        const [favoriteRows] = await pool.execute(`
          SELECT c.*,
                 TRUE as isFavorite,
                 COALESCE(c.recommended, FALSE) AS recommended,
                 COALESCE(c.isVideo, TRUE) AS isVideo
          FROM courses c
          JOIN favorites f ON c.id = f.course_id
          WHERE f.user_id = ?
        `, [userId]);
        
        return { statusCode: 200, headers, body: JSON.stringify(favoriteRows) };

      case 'GET /questions/random':
        if (!courseId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Course ID is required' }) };
        }

        const [questionRows] = await pool.execute(`
          SELECT id, question, options, answer, course_id
          FROM questions
          WHERE course_id = ?
          ORDER BY RAND()
          LIMIT ${count || 10}
        `, [courseId]);

        const processedQuestions = questionRows.map(row => ({
          ...row,
          options: JSON.stringify(Object.values(row.options))
        }));

        return { statusCode: 200, headers, body: JSON.stringify(processedQuestions) };

      case 'GET /instructors':
        const [instructorRows] = await pool.execute('SELECT * FROM instructors');
        return { statusCode: 200, headers, body: JSON.stringify(instructorRows) };

      case 'GET /assistants':
        const [assistantRows] = await pool.execute('SELECT id, name, greeting, prompt FROM Assistants');
        return { statusCode: 200, headers, body: JSON.stringify(assistantRows) };

      case 'GET /series':
        let seriesQuery = `
          SELECT s.*, i.name as instructor_name, i.description as instructor_bio, i.image as instructor_avatar
          FROM series s
          LEFT JOIN instructors i ON s.instructor_id = i.id
        `;
        
        const queryParams = [];
        
        if (instructor) {
          seriesQuery += ` WHERE s.instructor_id = ?`;
          queryParams.push(instructor);
        }
        
        seriesQuery += ` ORDER BY s.name`;
        
        const [seriesRows] = await pool.execute(seriesQuery, queryParams);
        return { statusCode: 200, headers, body: JSON.stringify(seriesRows) };

      case 'GET /series/:id':
        const [seriesDetailRows] = await pool.execute(`
          SELECT s.*, i.name as instructor_name, i.description as instructor_bio, i.image as instructor_avatar
          FROM series s
          LEFT JOIN instructors i ON s.instructor_id = i.id
          WHERE s.id = ?
        `, [parseInt(id)]);
        
        if (seriesDetailRows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Series not found' }) };
        }
        
        const [seriesCoursesRows] = await pool.execute(`
          SELECT c.*
          FROM courses c
          WHERE c.series_id = ?
          ORDER BY c.position, c.title
        `, [parseInt(id)]);
        
        const result = {
          ...seriesDetailRows[0],
          courses: seriesCoursesRows
        };
        
        return { statusCode: 200, headers, body: JSON.stringify(result) };

      default:
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};