import busboy from 'busboy';
import { connect } from './db.js';
import https from 'https';
import http from 'http';

const FUNC = '/.netlify/functions/'
const CONTENT_TYPES = { json: 'application/json', html: 'text/html', ast: 'application/json' }

let origin = '';

const getOrigin = () => origin;

const headers = (nocache, returnType = 'json') => ({
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Content-Length, Content-MD5, Accept, Accept-Version, Authorization, X-CSRF-Token, Date, X-Api-Version',
  'Access-Control-Allow-Methods':
    'GET,OPTIONS,POST,PUT,PATCH,DELETE,COPY,PURGE',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': nocache ? 'no-cahce' : 'max-age=31536000',
  'Content-Type': CONTENT_TYPES[returnType],
});

const res = (body, code, nocache, returnType) => ({
  statusCode: code || 200,
  headers: headers(nocache, returnType),
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const makeApi =
  ({ handlers = {}, db_handlers = {}, initAI, nocache }) =>
  async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const q = event.queryStringParameters;
    const method = event.httpMethod.toLowerCase();
    const isForm = (event.headers?.['content-type'] || '').includes('multipart/form-data');
    let body = method === 'post' && !isForm && tryc(() => JSON.parse(event.body));
    origin = event.rawUrl.slice(0, event.rawUrl.indexOf(FUNC) + FUNC.length);

    if (method === 'options') return res('');

    return tryc(
      async () => {
        let t = db_handlers[method]?.[q.type];
        if (t) await connect(q.db || 'prepai');
        else t = handlers[method]?.[q.type];
        if (!t) return res('', 404);

        initAI && (await initAI());
        if (q.params) q.params = JSON.parse(q.params);
        if (isForm) body = await parseForm(event);

        // Replace clientId with host-based lookup if clientId is present
        await replaceClientId(q, body, event.headers);
        
        // const r = await t(q, body, event, Response)
        const r = await t(q, body, event);
        return res(r || 'done', 200, nocache, q.returnType);
      },
      e => res(e, 500)
    );
  };

const parseForm = e => new Promise(res => {
  const fields = {};
  const bb = busboy({ headers: e.headers });

  bb.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    file.on('data', data => {
      fields[name] = {
        filename,
        type: mimeType,
        content: data,
      };
    });
  });

  bb.on("field", (k, v) => fields[k] = v);
  bb.on("close", () => res(fields));
  bb.end(Buffer.from(e.body, 'base64'));
});

const tryc = (func, err) => {
  try {
    return func();
  } catch (e) {
    console.error(e);
    return typeof err === 'function' ? err(e) : err;
  }
};

const replaceClientId = async (q, body, headers) => {
  // Replace clientId with host-based lookup if clientId is present
  if (q.clientId || body?.clientId || q.client_id || body?.client_id) {
    const { getClientByHost } = await import('./rep.js');
    const host = headers?.host || headers?.Host;

    if (host) {
      const client = await getClientByHost(host);
      if (client) {
        if (q.clientId) q.clientId = client.id;
        if (q.client_id) q.client_id = client.id;
        if (body?.clientId) body.clientId = client.id;
        if (body?.client_id) body.client_id = client.id;
      }
    }
  } else if (body?.client) { // if don't want to be replaced, send client instead of clientId
    body.client_id = body.client;
    delete body.client;
  }
};

// Proxy image handler to avoid CORS issues
const proxyImage = async (q, b, req) => {
  const imageUrl = decodeURIComponent(q.url);
  
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    throw new Error('Invalid image URL');
  }
  
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https://') ? https : http;
    
    const request = protocol.get(imageUrl, (response) => {
      // Check if the response is an image
      const contentType = response.headers['content-type'];
      // if (!contentType || !contentType.startsWith('image/')) {
      //   reject(new Error('URL does not point to an image'));
      //   return;
      // }
      
      // Set appropriate headers for the proxied image
      req.res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*'
      });
      
      // Pipe the image data directly to the response
      response.pipe(req.res);
      
      response.on('end', () => {
        resolve(); // Don't return data, as we're streaming directly
      });
      
      response.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    // Set timeout for the request
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

export {
  getOrigin,
  headers,
  res,
  makeApi,
  parseForm,
  tryc,
  replaceClientId,
  proxyImage
};
