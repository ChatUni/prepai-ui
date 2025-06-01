import { get, save, remove, flat } from './db.js';
import { handleUrlSigning, handleFileUpload } from './cosServerHelper';

export default {
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
  handlers: {
    post: {
      cos_sign: (q, b) => handleUrlSigning(b.url),
      cos_upload: (q, b) => handleFileUpload(b.file, b.key),
    },
  },
  nocache: true,
}
