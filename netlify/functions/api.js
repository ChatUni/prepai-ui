const { makeApi } = require('../../server/utils/http.js');
const apiHandlers = require('../../server/utils/apiHandlers.js');

exports.handler = makeApi(apiHandlers);
