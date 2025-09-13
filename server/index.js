import { connect } from './utils/db.js';
import { res, tryc } from './utils/http.js';
import { db_handlers, handlers, nocache } from './utils/apiHandlers.js';

export const handler = async (event, context) => {
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
  
  // Handle file serving responses
  if (q.type === 'tos_file' && r && r.body) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': r.contentType,
        'Content-Length': r.contentLength,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=31536000'
      },
      body: r.body.toString('base64'),
      isBase64Encoded: true
    };
  }
  
  // Handle error responses from file serving
  if (q.type === 'tos_file' && r && r.error) {
    return res({ error: r.error }, r.status || 500, nocache, q.returnType);
  }
  
  return res(r || 'done', 200, nocache, q.returnType);
}