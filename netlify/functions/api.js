import { parsePathParams } from './utils/pathUtils.js';
import { getResponseHeaders, res } from './utils/http.js';
import { get, save, remove, flat, maxId } from './utils/db.js';
import { tap } from './utils';
import multipart from 'multipart-formdata';
import fs from 'fs';
import path from 'path';
import { cdupload } from './utils/cloudinary.js';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);


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
    const { clientId, userId, seriesId, courseId, instructorId, doc } = event.queryStringParameters || {};
    const route = `${event.httpMethod} /${resource}${id ? (isNaN(+id) ? `/${id}` : '/:id') : ''}`
    
    console.log(`Route: ${route}, Resource: ${resource}, id: ${id}`);

    // Handle file upload separately since it's not JSON
    if (route === 'POST /cloudinary_upload') {
      const contentType = event.headers['content-type'] || event.headers['Content-Type'];
      const { files, folder } = tap(multipart.parse(event.body, contentType));
      
      if (!files || !files.length) {
        return res({ error: 'No file provided' }, 400);
      }

      const file = files[0];
      const tempPath = path.join('/tmp', `upload-${Date.now()}-${file.filename}`);

      try {
        // Save file to temp location
        await writeFile(tempPath, file.content);

        // Upload to Cloudinary with optional folder
        const result = await cdupload(tempPath, folder);

        // Clean up temp file
        await unlink(tempPath);

        return res({
          url: result.secure_url,
          public_id: result.public_id
        });
      } catch (error) {
        // Clean up temp file in case of error
        try {
          await unlink(tempPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        throw error;
      }
    }

    // For non-file upload routes, parse body as JSON
    const body = event.body ? JSON.parse(event.body) : {};

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
        const questions = await flat('questions', `m_course_id=${courseId}&r_size=10`)
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

      case 'POST /save':
        if (!body.id) body.id = await maxId(doc)
        await save(doc, body);
        return res(body);

      default:
        return res({ error: 'Not found' }, 404);
    }
  } catch (error) {
    console.error('Error:', error);
    return res({ error: 'Internal server error' }, 500)
  }
};