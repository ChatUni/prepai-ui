import { parsePathParams } from './utils/pathUtils.js';
import { getResponseHeaders } from './utils/headers.js';
import { tap } from './utils';

const API = (type, doc, agg) => `https://freshroad.netlify.app/.netlify/functions/api?db=prepai&type=${type}&doc=${doc}${agg ? `&agg=${encodeURIComponent(agg)}` : ''}`
const get = doc => fetch(API('doc', doc)).then(res => res.json())
const flat = (doc, agg) => fetch(API('flat', doc, tap(agg))).then(res => res.json())
const post = (doc, data) => fetch(API('save', doc), { method: 'POST', body: JSON.stringify(data) }).then(res => res.json())
const res = body => ({ statusCode: 200, headers: getResponseHeaders(), body: JSON.stringify(body) })

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
    const { clientId, seriesId, courseId, instructorId } = event.queryStringParameters;
    const body = event.body ? JSON.parse(event.body) : {};

    console.log(`${event.httpMethod} /${resource}${id ? '/:id' : ''}`);

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'GET /courses':
        const coursesInSeries = await flat('courses', `${seriesId ? `m_series_id=${seriesId}&` : ''}f_series|series,instructor`)
        return res(coursesInSeries);
      case 'GET /courses/:id':
        const courses = await flat('courses', `m_id=${id}&f_series|series,instructor`)
        return res(courses);
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
        const favorites = await get('favorites')
        return res(favorites);
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
        const instructors = await get('instructors');
        return res(instructors);

      case 'GET /assistants':
        const assistants = await get('assistants');
        return res(assistants);

      case 'GET /series':
        const seriesOfInstructor = await flat('series', `${instructorId ? `m_instructor_id=${instructorId}&` : ''}f_instructor`);
        return res(seriesOfInstructor);

      case 'GET /series/:id':
        const series = await flat('series', `m_id=${id}`)
        return res(series);

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