import { makeApi } from './utils/http';
import { connect, get, save, remove, flat, maxId } from './utils/db.js';
import { cdupload, cdDelete } from './utils/cloudinary.js';

export const handler = makeApi({
  db_handlers: {
    get: {
      clients: q => flat('clients', `m_id=${q.id}`),
      courses: q => flat('courses', `${q.seriesId ? `m_series_id=${q.seriesId}&` : ''}f_series|series&f_instructor`),
      instructors: q => flat('instructors', `m_client_id=${q.clientId}`),
      assistants: q => get('assistants'),
      series: q => flat('series', `m_client_id=${q.clientId}&f_+course`),
      users: q => flat('users', `m_phone=${q.phone}`),
      questions: q => flat('questions', `m_course_id=${q.courseId}&r_size=10`),
      favorites: q => flat('favorites', `m_user_id=${q.userId}`),
    },
    post: {
      save: (q, b) => save(q.doc, b),
    },
  },
  nocache: true,
})
