const { get, save, remove, flat } = require('./db.js');
const { handleUrlSigning, handleFileUpload, handleFileServing } = require('./volcHelper.js');

module.exports = {
  db_handlers: {
    get: {
      clients: q => flat('clients', `m_id=${q.id}&f_+memberships`),
      courses: q => flat('courses', `${q.seriesId ? `m_series_id=${q.seriesId}&` : ''}f_series|series&f_instructors`),
      instructors: q => flat('instructors', `m_client_id=${q.clientId}`),
      platform_assistants: q => flat('assistants', `m_type=1`),
      client_assistants: q => flat('assistants', `m_client_id=${q.clientId}`),
      memberships: q => flat('memberships', `m_client_id=${q.clientId}`),
      exams: q => flat('exams', `m_client_id=${q.clientId}`),
      models: q => flat('models', `m_enabled=true&p_id,name,pricing`),
      series: q => flat('series', `m_client_id=${q.clientId}&f_+courses|course|series`),
      users: q => flat('users', `m_phone='${q.phone}'&m_client_id=${q.clientId}&f_+transactions`),
      questions: q => flat('questions', `m_course_id=${q.courseId}&r_size=10`),
      favorites: q => flat('favorites', `m_user_id=${q.userId}`),
    },
    post: {
      save: (q, b) => save(q.doc, b),
      remove: (q, b) => remove(q.doc, b.id),
    },
  },
  handlers: {
    get: {
      tos_file: (q) => handleFileServing(q.key),
    },
    post: {
      tos_sign: (q, b) => handleUrlSigning(b.url),
      tos_upload: (q, b) => handleFileUpload(b.file, b.key),
    },
  },
  nocache: true,
}
