const { save, remove, flat } = require('./db.js');
const { handleUrlSigning, handleFileUpload, handleFileServing, handleFileDelete, getAllFilesInFolder, jimeng, queryJimengTask, run_workflow, getVoiceOptions } = require('./volcHelper.js');
const { wechat_pay, wechat_query } = require('./wechat.js');
const { send_sms, verify_sms } = require('./sms.js');
const { chat, draw, video, tts } = require('../openai.js');
const { upgradeAll, withdraw } = require('./account.js');

module.exports = {
  db_handlers: {
    get: {
      clients: q => flat('clients', `m_id=${q.id}&f_+memberships`),
      courses: q => flat('courses', `${q.seriesId ? `m_series_id=${q.seriesId}&` : ''}f_series|series&f_instructors`),
      instructors: q => flat('instructors', `m_client_id=${q.clientId}`),
      assistants: q => flat('assistants', `m_type=platform|client_id=${q.clientId}|user_id=${q.userId}`),
      memberships: q => flat('memberships', `m_client_id=${q.clientId}`),
      exams: q => flat('exams', `m_client_id=${q.clientId}`),
      models: q => flat('models', `m_enabled=true&p_id,name,pricing`),
      series: q => flat('series', `m_client_id=${q.clientId}&f_+courses|course|series`),
      user: q => flat('users', `m_phone='${q.phone}'&m_client_id=${q.clientId}&f_+orders`),
      users: q => flat('users', `m_client_id=${q.clientId}`),
      orders: q => flat('orders', `m_client_id=${q.clientId}&f_users`),
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
      tos_folder: (q) => getAllFilesInFolder(q.folder),
      voice_options: () => getVoiceOptions(),
    },
    post: {
      chat: (q, b) => chat(q.api, b, false),
      draw: (q, b) => draw(b, false),
      video: (q, b) => video(b, false),
      tts: (q, b) => tts(b, false),
      jimeng: (q, b) => jimeng(b),
      jimeng_query: (q, b) => queryJimengTask(b.taskId),
      run_workflow: (q, b) => run_workflow(q.workflow_id, b),
      tos_sign: (q, b) => handleUrlSigning(b.url),
      tos_upload: (q, b) => handleFileUpload(b.file, b.key),
      tos_delete: (q, b) => handleFileDelete(b.key),
      upgrade: (q, b) => upgradeAll(b),
      withdraw: (q, b) => withdraw(b),
      wechat_pay,
      wechat_query,
      send_sms,
      verify_sms
    },
  },
  nocache: true,
}
