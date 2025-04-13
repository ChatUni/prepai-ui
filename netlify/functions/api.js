import { parsePathParams } from './utils/pathUtils.js';
import { getResponseHeaders, res } from './utils/http.js';
import { get, save, remove, flat, maxId } from './utils/db.js';
import { tap } from './utils';


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
    const { clientId, userId, seriesId, courseId, instructorId } = event.queryStringParameters;
    const body = event.body ? JSON.parse(event.body) : {};
    const route = `${event.httpMethod} /${resource}${id ? (isNaN(+id) ? `/${id}` : '/:id') : ''}`

    console.log(`Route: ${route}, Resource: ${resource}, id: ${id}`);

    // Route handlers
    switch (route) {
      case 'GET /courses':
        const coursesInSeries = await flat('courses', `${seriesId ? `m_series_id=${seriesId}&` : ''}f_series|series,instructor`)
        return res(coursesInSeries);
      case 'GET /courses/:id':
        const courses = await flat('courses', `m_id=${id}&f_series|series,instructor`)
        return res(courses);
      case 'POST /favorites/toggle':
        const favCourses = await flat('favorites', `m_course_id=${courseId},user_id=${userId}`)

        if (favCourses.length > 0) {
          await remove('favorites', favCourses[0].id);
          return res({ isFavorite: false, message: 'Removed from favorites' });
        } else {
          const newId = await maxId('favorites')
          await save('favorites', { id: newId, user_id: +userId, course_id: +courseId })
          return res({ isFavorite: true, message: 'Added to favorites' });
        }

      case 'GET /favorites':
        const favorites = await get('favorites')
        return res(favorites);
      case 'GET /questions/random':
        const questions = await flat('questions', 'r_size=10')
        const processedQuestions = questions.map(row => ({
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