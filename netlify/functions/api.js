import { parsePathParams } from './utils/pathUtils.js';
import { getResponseHeaders, res } from './utils/http.js';
import { connect, get, save, remove, flat, maxId } from './utils/db.js';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { cdupload, cdDelete } from './utils/cloudinary.js';
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
      console.log('Content-Type:', contentType);

      // Convert base64 body to buffer if needed
      let bodyBuffer = event.body;
      if (event.isBase64Encoded) {
        bodyBuffer = Buffer.from(event.body, 'base64');
      } else {
        bodyBuffer = Buffer.from(event.body);
      }

      return await new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: { 'content-type': contentType } });
        let uploadPromise = null;
        let folder = null;

        busboy.on('file', async (fieldname, file, { filename, encoding, mimeType }) => {
          if (fieldname === 'file') {
            const tempPath = path.join('/tmp', `upload-${Date.now()}-${filename}`);
            const writeStream = fs.createWriteStream(tempPath);
            
            file.pipe(writeStream);

            uploadPromise = new Promise((resolveUpload, rejectUpload) => {
              writeStream.on('finish', async () => {
                try {
                  const result = await cdupload(tempPath, folder);
                  await unlink(tempPath);
                  resolveUpload(result);
                } catch (error) {
                  await unlink(tempPath).catch(() => {});
                  rejectUpload(error);
                }
              });
              
              writeStream.on('error', async (error) => {
                await unlink(tempPath).catch(() => {});
                rejectUpload(error);
              });
            });
          }
        });

        busboy.on('field', (fieldname, value) => {
          if (fieldname === 'folder') {
            folder = value;
          }
        });

        busboy.on('finish', async () => {
          try {
            if (!uploadPromise) {
              resolve(res({ error: 'No file provided' }, 400));
              return;
            }
            
            const result = await uploadPromise;
            resolve(res({
              url: result.secure_url,
              public_id: result.public_id
            }));
          } catch (error) {
            console.error('Upload error:', error);
            resolve(res({ error: 'Upload failed: ' + error.message }, 500));
          }
        });

        busboy.on('error', (error) => {
          console.error('Parsing error:', error);
          resolve(res({ error: 'Failed to parse upload: ' + error.message }, 400));
        });

        busboy.write(bodyBuffer);
        busboy.end();
      });
    } else {

      await connect()

      // For non-file upload routes, parse body as JSON
      const body = event.body ? JSON.parse(event.body) : {};

      console.log(`Route: ${route}, Resource: ${resource}, id: ${id}`);

      // Route handlers
      switch (route) {
        case 'GET /courses':
          const coursesInSeries = await flat('courses', `${seriesId ? `m_series_id=${seriesId}&` : ''}f_series|series&f_instructor`)
          return res(coursesInSeries);
        case 'GET /courses/:id':
          const courses = await flat('courses', `m_id=${id}&f_series|series&f_instructor`)
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
          const instructors = await flat('instructors', `m_client_id=${clientId}`);
          return res(instructors);

        case 'GET /assistants':
          const assistants = await get('assistants');
          return res(assistants);

        case 'GET /series':
          //const seriesOfInstructor = await flat('series', `m_client_id=${clientId}&f_+course&p_id,name,category,desc,group,order,price,duration,cover,courses.id,courses.instructor_id`);
          const seriesOfInstructor = await flat('series', `m_client_id=${clientId}&f_+course`);
          return res(seriesOfInstructor);

        case 'GET /series/:id':
          const series = await flat('series', `m_id=${id}`)
          return res(series);

        case 'GET /clients/:id':
          const clients = await flat('clients', `m_id=${id}`)
          return res(clients.length > 0 ? clients[0] : null);

        case 'GET /users/:phone':
          const users = await flat('users', `m_phone=${phone}`)
          return res(users.length > 0 ? users[0] : null);

        case 'POST /save':
          if (!body.id) body.id = await maxId(doc)
          await save(doc, body);
          return res(body);

        case 'DELETE /cloudinary_delete':
          const cdDeleted = await cdDelete(body.public_id);
          return res(cdDeleted)

        default:
          return res({ error: 'Not found' }, 404);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return res({ error: 'Internal server error' }, 500)
  }
};