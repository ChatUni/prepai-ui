const { connect } = require('./utils/db.js');
const { res, tryc } = require('./utils/http.js');
const { db_handlers, handlers, nocache } = require('./utils/apiHandlers.js');

exports.handler = async (event, context) => {
  // context.callbackWaitsForEmptyEventLoop = false;
  const q = event.queryStringParameters;
  const method = event.httpMethod.toLowerCase();
  const isForm = (event.headers?.['content-type'] || '').includes('multipart/form-data');
  let body = method === 'post' && !isForm && tryc(() => JSON.parse(event.body));

  if (method === 'options') return res('');

  let t = db_handlers[method]?.[q.type];
  if (t) await connect(q.db || 'prepai');
  else t = handlers[method]?.[q.type];
  if (!t) return res('', 404);

  if (q.params) q.params = JSON.parse(q.params);
  if (isForm) body = await parseForm(event);
  const r = await t(q, body, event);
  return res(r || 'done', 200, nocache, q.returnType);
}