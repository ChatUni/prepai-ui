// Shared headers for all API responses
export const getResponseHeaders = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
});

export const res = (body, code = 200) => ({ statusCode: code, headers: getResponseHeaders(), body: JSON.stringify(body) })
